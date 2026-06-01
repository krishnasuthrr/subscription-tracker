import { Router } from "express";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const { serve } = require("@upstash/workflow/express");

const testRouter = Router()

testRouter.post(
  "/test-workflow",
  serve(async (context) => {
    console.log("WORKFLOW START");

    await context.run("Initial Step", async () => {
      console.log("STEP 1");
    });

    console.log("BEFORE SLEEP");

    await context.sleep("wait", 10);

    console.log("AFTER SLEEP");

    await context.run("Next Step", async () => {
      console.log("STEP 2");
    });

    console.log("WORKFLOW END");
  }),
);

export default testRouter