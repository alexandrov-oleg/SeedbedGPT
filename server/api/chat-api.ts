import * as botApi from '../bot-engine';
import { chatCompletionLC } from "../lang-chain-bot";

const api = [
    {
        endpoint: 'completions/create',
        method: 'POST',
        handler: async (req: any, res: any) => {
            let error;
            let data;

            if (req.body) {
                try {
                    data = await botApi.chatCompletion(req.body);
                } catch (e) {
                    console.log(e);
                    error = e;
                }
            } else {
                error = new Error('No text provided');
            }

            if (error) {
                res.status(500).send(error);
            } else {
                res.send(data);
            }
        },
    },
    {
        endpoint: 'jobs',
        method: 'GET',
        handler: async (req: any, res: any) => {
            try {
                const { data } = await botApi.getJobs();

                res.send(data);
            } catch (error) {
                res.status(500).send(error);
            }
        },
    },
    {
        endpoint: 'job/:jobId',
        method: 'GET',
        handler: async (req: any, res: any) => {
            try {
                const jobId = req.params.jobId;
                const job = await botApi.getJobState(jobId);

                res.send(job);
            } catch (error) {
                res.status(500).send(error);
            }
        },
    },
    {
        endpoint: 'events/:jobId',
        method: 'GET',
        handler: async (req: any, res: any) => {
            try {
                const jobId = req.params.jobId;
                const job = await botApi.getJobEvents(jobId);

                res.send(job);
            } catch (error) {
                res.status(500).send(error);
            }
        },
    },
    {
        endpoint: 'jobs/start',
        method: 'PUT',
        handler: async (req: any, res: any) => {
            try {
                const data = req.body;
                const job = await botApi.createJob(data);

                res.send(job);
            } catch (error) {
                res.status(500).send(error);
            }
        },
    },
    {
        endpoint: 'jobs/cancel',
        method: 'POST',
        handler: async (req: any, res: any) => {
            try {
                const jobId = req.body.jobId;
                await botApi.cancelJob(jobId);

                res.send();
            } catch (error) {
                res.status(500).send(error);
            }
        },
    },
    {
        endpoint: 'training-files',
        method: 'GET',
        handler: async (req: any, res: any) => {
            try {
                const files = botApi.getFileNamesInFolder('server/training-data');
                res.send(files);
            } catch (error) {
                res.status(500).send(error);
            }
        },
    },

  {
    endpoint: "completions/create-lc",
    method: "POST",
    handler: async (req: any, res: any) => {
      let error;
      let data;

      if (req.body) {
        try {
          console.log(JSON.stringify(req.body));
          data = await chatCompletionLC(req.body);
        } catch (e) {
          console.log(e);
          error = e;
        }
      } else {
        error = new Error("No text provided");
      }

      if (error) {
        res.status(500).send(error);
      } else {
        res.send(data);
      }
    },
  },
];

export default api;
