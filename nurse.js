// Sample patient requests
let requests = [
  { id: 1, patientName: "John Smith", task: "Needs water", status: "Pending" },
  { id: 2, patientName: "Mary Johnson", task: "Needs help walking", status: "Pending" },
  { id: 3, patientName: "John Smith", task: "Pain medication request", status: "In Progress" },

  { id: 4, patientName: "David Brown", task: "Bathroom assistance", status: "Pending" },
  { id: 5, patientName: "Sarah Davis", task: "Needs blanket", status: "Pending" },
  { id: 6, patientName: "Michael Wilson", task: "IV check", status: "In Progress" },
  { id: 7, patientName: "Emily Taylor", task: "Feeling dizzy", status: "Pending" },
  { id: 8, patientName: "Chris Anderson", task: "Food request", status: "Pending" },
  { id: 9, patientName: "Jessica Thomas", task: "Pain medication request", status: "Pending" },
  { id: 10, patientName: "Daniel Martinez", task: "Needs water", status: "In Progress" },

  { id: 11, patientName: "Ashley Moore", task: "Call family member", status: "Pending" },
  { id: 12, patientName: "Joshua Jackson", task: "Help sitting up", status: "Pending" },
  { id: 13, patientName: "Amanda White", task: "Check temperature", status: "Pending" },
  { id: 14, patientName: "Matthew Harris", task: "Needs oxygen adjustment", status: "In Progress" },
  { id: 15, patientName: "Olivia Martin", task: "Bathroom assistance", status: "Pending" },

  { id: 16, patientName: "James Thompson", task: "Needs water", status: "Pending" },
  { id: 17, patientName: "Sophia Garcia", task: "Feeling nauseous", status: "Pending" },
  { id: 18, patientName: "Ethan Rodriguez", task: "Pain medication request", status: "In Progress" },
  { id: 19, patientName: "Isabella Martinez", task: "Adjust bed position", status: "Pending" },
  { id: 20, patientName: "Liam Hernandez", task: "Call nurse", status: "Pending" }
];
  
  // Display all requests
  function displayRequests(requestList) {
    const requestContainer = document.getElementById("requestList");
    requestContainer.innerHTML = "";
  
    requestList.forEach(request => {
      const requestCard = document.createElement("div");
      requestCard.className = "request-card";
  
      requestCard.innerHTML = `
        <h3>Patient: ${request.patientName}</h3>
        <p>Request: ${request.task}</p>
        <p>Status: <strong>${request.status}</strong></p>
        <button onclick="markInProgress(${request.id})">
          Mark In Progress
        </button>
      `;
  
      requestContainer.appendChild(requestCard);
    });
  }
  
  // Mark a request as in progress
  function markInProgress(requestId) {
    const request = requests.find(req => req.id === requestId);
  
    if (request.status === "In Progress") {
      alert("This request is already being fulfilled.");
      return;
    }
  
    request.status = "In Progress";
    displayRequests(requests);
  }
  
  // Filter requests by patient name
  function filterByPatient() {
    const patientName = document.getElementById("patientSearch").value.toLowerCase();
  
    const filteredRequests = requests.filter(request =>
      request.patientName.toLowerCase().includes(patientName)
    );
  
    displayRequests(filteredRequests);
  }
  
  // Load requests when page opens
  displayRequests(requests);