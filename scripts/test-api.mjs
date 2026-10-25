async function testApi() {
  const prompt = "I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and will not make me late.";

  console.log("1. Sending Request to /api/assistant...");
  const res1 = await fetch("http://localhost:3000/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data1 = await res1.json();
  console.log("Response Status:", res1.status);
  console.log("Plan ID:", data1.plan?.id);
  console.log("Is Feasible:", data1.plan?.isFeasible);
  console.log("Total Duration:", data1.plan?.totalDurationMinutes, "min");
  console.log("Total Cost: ₹" + data1.plan?.totalCost);
  console.log("Plan Status:", data1.plan?.status);
  console.log("Requires Confirmation:", data1.plan?.requiresConfirmation);
  console.log("Print Proposal:", data1.plan?.printProposal?.totalPages, "pages, ₹" + data1.plan?.printProposal?.totalCost);
  console.log("Food Proposal:", data1.plan?.foodProposal?.items?.map(i => i.name).join(", "), "₹" + data1.plan?.foodProposal?.totalCost);

  console.log("\n2. Sending Confirmation to /api/assistant/confirm...");
  const res2 = await fetch("http://localhost:3000/api/assistant/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: data1.plan?.id }),
  });
  const data2 = await res2.json();
  console.log("Confirm Status:", res2.status);
  console.log("Updated Plan Status:", data2.plan?.status);
  console.log("Created Print Order:", data2.printOrder?.id, "Cost: ₹" + data2.printOrder?.totalCost, "Simulated:", data2.printOrder?.isSimulated);
  console.log("Created Food Order:", data2.foodOrder?.id, "Cost: ₹" + data2.foodOrder?.totalCost, "Simulated:", data2.foodOrder?.isSimulated);

  console.log("\n3. Testing Duplicate Confirmation Prevention...");
  const res3 = await fetch("http://localhost:3000/api/assistant/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: data1.plan?.id }),
  });
  const data3 = await res3.json();
  console.log("Duplicate Confirm Rejected with Status:", res3.status);
  console.log("Error message:", data3.error);

  console.log("\n4. Testing Infeasible Request (12 min break)...");
  const res4 = await fetch("http://localhost:3000/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "I have 12 minutes before class. Need 50 pages printed and a lunch thali." }),
  });
  const data4 = await res4.json();
  console.log("Infeasible Plan isFeasible:", data4.plan?.isFeasible);
  console.log("Conflicts:", data4.plan?.conflicts);
  console.log("Number of Alternatives:", data4.plan?.alternatives?.length);
}

testApi().catch(console.error);
