import app from "./app";
import { ReminderJob } from "./jobs/ReminderJob";
import { HoldCleanupJob } from "./jobs/HoldCleanupJob";

const PORT = process.env.PORT || 4000;

ReminderJob.init();
HoldCleanupJob.init();

app.listen(PORT, () => {
  console.log(`Clinic Scheduler running on port ${PORT}`);
});
