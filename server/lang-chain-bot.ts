import { apiKey } from './config';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { BufferMemory } from 'langchain/memory';
import { RunnableBranch, RunnableSequence } from 'langchain/schema/runnable';
import { PromptTemplate } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { LLMChain } from 'langchain/chains';
import * as fs from 'fs';

const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0.9,
    openAIApiKey: apiKey,
});

// import nomad from './assets/cypress/nomad/nomad';
// import baseView from "./assets/cypress/nomad/views/base-view.js?raw";
// import listView from "./assets/cypress/nomad/views/list-view.js";
// import editView from "./assets/cypress/nomad/views/edit-view/edit-view.js";
// import detailView from "./assets/cypress/nomad/views/detail-view/detail-view.js";
// import loginView from "./assets/cypress/nomad/views/login-view.js";

/* Initialize the LLM to use to answer the question */
// const model = new ChatOpenAI({
//   modelName: "text-davinci-003",
//   temperature: 0.9,
//   openAIApiKey: "",
// });
// /* Load in the file we want to do question answering over */
// const text = fs.readFileSync("./context/cypress/views/base-view.js", "utf8");
// const urls = [
//   text,
//   // nomad,
//   // baseView,
//   // listView,
//   // editView,
//   // detailView,
//   // loginView,
// ];

const contextFilePaths = [
    // "./context/cypress/views/base-view.js",
    // "./context/cypress/views/detail-view/detail-view.js",
    // "./context/cypress/views/edit-view/edit-view.js",
    // "./context/cypress/views/edit-view/opportunities-edit-view.js",
    // "./context/cypress/views/filters/filter-builder.js",
    // "./context/cypress/views/tab-switcher.js",
    // "./context/cypress/views/related-actions.js",
    // "./context/cypress/views/global-search-view.js",
    // "./context/cypress/views/filters-drop-down-view.js",
    // "./context/cypress/views/sorting-drop-down-view.js",
    // "./context/cypress/views/header-view.js",
    // "./context/cypress/views/popup-view.js",
    // "./context/cypress/views/settings.js",
    // "./context/cypress/views/alerts.js",
    // "./context/cypress/views/search-box-view.js",
    // "./context/cypress/views/calendar/index.js",
    // "./context/cypress/views/multiselect-panel-view.js",
    // "./context/cypress/views/emails-create-view.js",
    // "./context/cypress/views/sugar-maps-view.js",
    // "./context/cypress/views/geocoding-view.js",
    // "./context/cypress/views/related-maps-view.js",
    // "./context/cypress/views/recurrence.js",
    // "./context/cypress/views/dashboard/dashboard-view.js",
    // "./context/cypress/views/dashboard/docusign-dashlet-view.js",
    // "./context/cypress/views/dashboard/dashlet-slider-view.js",
    // "./context/cypress/views/dashboard/report-dashlet-view.js",
    // "./context/cypress/views/dashboard/report-dashlet-settings-view.js",
    // "./context/cypress/views/dashboard/data-table-view.js",
    // "./context/cypress/views/dashboard/chart-view.js",
    // "./context/cypress/views/dashboard/runtime-filters-view.js",
    // "./context/cypress/views/lead-conversion-view.js",
    './context/nomad.html',
];

const cypressFramework = [];
const textSplitter = new RecursiveCharacterTextSplitter();

for (let fp of contextFilePaths) {
    const text = fs.readFileSync(fp, 'utf8');

    // const docUrl = new URL(doc as any).href;
    // const text = await fetch(docUrl).then((res) => res.text());

    const newDoc = await textSplitter.createDocuments([text]);
    cypressFramework.push(newDoc);
}

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: apiKey,
    stripNewLines: true,
});
/* Split the text into chunks */
// const textSplitter = new RecursiveCharacterTextSplitter();
// const docs = await textSplitter.createDocuments(cypressFramework);
/* Create the vectorstore */
const vectorStore = await HNSWLib.fromDocuments(cypressFramework.flat(), embeddings);
const retriever = vectorStore.asRetriever();

const serializeChatHistory = (chatHistory: any) => {
    if (Array.isArray(chatHistory)) {
        return chatHistory.join('\n');
    }
    return chatHistory;
};

const serializeDocs = (docs: any) => docs.map((doc: any) => doc.pageContent).join('\n');

const memory = new BufferMemory({
    memoryKey: 'chatHistory',
});

/**
 * Create a prompt template for generating an answer based on context and
 * a question.
 *
 * Chat history will be an empty string if it's the first question.
 *
 * inputVariables: ["chatHistory", "context", "question"]
 */
const questionPrompt = PromptTemplate.fromTemplate(
    `Act as a quality analyst who is highly experienced in gherkin and cypress. Write chunks of code without backticks.
----------------
CHAT HISTORY: {chatHistory}
----------------
CONTEXT: {context}
----------------
QUESTION: {question}
----------------
Helpful Answer:`,
);

/**
 * Creates a prompt template for __generating a question__ to then ask an LLM
 * based on previous chat history, context and the question.
 *
 * inputVariables: ["chatHistory", "question"]
 */
const questionGeneratorTemplate =
    PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
----------------
CHAT HISTORY: {chatHistory}
----------------
FOLLOWUP QUESTION: {question}
----------------
Standalone question:`);

const handleProcessQuery = async (input: any) => {
    const chain = new LLMChain({
        llm: model,
        prompt: questionPrompt,
        outputParser: new StringOutputParser(),
    });

    // somehow this returns only response text
    const response = await chain.call({
        ...input,
        chatHistory: serializeChatHistory(input.chatHistory ?? ''),
    });

    const { text } = response;

    await memory.saveContext(
        {
            human: input.question,
        },
        {
            ai: text,
        },
    );

    return text;
};

const answerQuestionChain = RunnableSequence.from([
    {
        // input: {
        //   question: string;
        //   chatHistory?: string | Array<string>;
        // }
        role: input => input.role,
        question: input => input.question,
    },
    {
        role: input => input.role,
        question: previousStepResult => previousStepResult.question,
        chatHistory: previousStepResult => serializeChatHistory(previousStepResult.chatHistory ?? ''),
        context: async previousStepResult => {
            // Fetch relevant docs and serialize to a string.
            const relevantDocs = await retriever.getRelevantDocuments(previousStepResult.question);
            const serialized = serializeDocs(relevantDocs);
            console.log(`Context: \n${serialized}`);

            return serialized;
        },
    },
    handleProcessQuery,
]);

const generateQuestionChain = RunnableSequence.from([
    {
        role: input => input.role,
        question: input => input.question,
        chatHistory: async () => {
            const memoryResult = await memory.loadMemoryVariables({});
            return serializeChatHistory(memoryResult.chatHistory ?? '');
        },
    },
    questionGeneratorTemplate,
    model,
    // Take the result of the above model call, and pass it through to the
    // next RunnableSequence chain which will answer the question
    {
        // previousStepResult: { text: string }
        question: previousStepResult => previousStepResult.text,
    },
    answerQuestionChain,
]);

const branch = RunnableBranch.from([
    [
        async () => {
            const memoryResult = await memory.loadMemoryVariables({});
            const isChatHistoryPresent = !memoryResult.chatHistory.length;

            return isChatHistoryPresent;
        },
        answerQuestionChain,
    ],
    [
        async () => {
            const memoryResult = await memory.loadMemoryVariables({});
            const isChatHistoryPresent = !!memoryResult.chatHistory && memoryResult.chatHistory.length;

            return isChatHistoryPresent;
        },
        generateQuestionChain,
    ],
    answerQuestionChain,
]);

const fullChain = RunnableSequence.from([
    {
        // input: { question: string }
        question: input => input.question,
    },
    branch,
]);

// const resultOne = await fullChain.invoke({
//   question: "what does findInputWithLabel in BaseView ?",
// });

// console.log({ resultOne });
/**
 * {
 *   resultOne: 'The president thanked Justice Breyer for his service and described him as an Army veteran, Constitutional scholar, and retiring Justice of the United States Supreme Court.'
 * }
 */

// const resultTwo = await fullChain.invoke({
//   question: "Can you show me its code?",
// });

// console.log({ resultTwo });
/**
 * {
 *   resultTwo: "Yes, the president's description of Justice Breyer was positive."
 * }
 */

export const chatCompletionLC = async (data: any) => {
    const resultMessage = data.messages?.reduce((acc: any, msg: any) => acc + msg.content, '');

    console.log('asking bot for ' + resultMessage);
    let result = '';

    for (let message of data.messages) {
        result += await fullChain.invoke({
            question: message.content,
            role: message.role,
        });
        result += '\n';
    }

    console.log('bot says: ');
    console.log(result);

    // need to mimic openAI response to correctly render on web
    return {
        choices: [
            {
                message: {
                    content: result,
                },
            },
        ],
    };
};
