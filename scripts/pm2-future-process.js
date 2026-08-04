const role = process.argv[2] || process.env.CFCB_PROCESS_ROLE || "future-process";

console.info(`Courier Fraud Check BD ${role} process is reserved for a future milestone.`);
console.info("No worker or scheduler runtime is started in Milestone 12.");
