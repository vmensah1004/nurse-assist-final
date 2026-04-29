// Sample patient requests
let requests = [
  { id: 1, patientName: "John Smith", task: "Needs water", status: "Pending", priority: "Low" },
  { id: 2, patientName: "Mary Johnson", task: "Needs help walking", status: "Pending", priority: "Low" },
  { id: 3, patientName: "John Smith", task: "Pain medication request", status: "In Progress", priority: "Low" },

  { id: 4, patientName: "David Brown", task: "Bathroom assistance", status: "Pending", priority: "Low" },
  { id: 5, patientName: "Sarah Davis", task: "Needs blanket", status: "Pending" , priority: "Low"},
  { id: 6, patientName: "Michael Wilson", task: "IV check", status: "In Progress", priority: "Low" },
  { id: 7, patientName: "Emily Taylor", task: "Feeling dizzy", status: "Pending", priority: "Low" },
  { id: 8, patientName: "Chris Anderson", task: "Food request", status: "Pending", priority: "High" },
  { id: 9, patientName: "Jessica Thomas", task: "Pain medication request", status: "Pending", priority: "High" },
  { id: 10, patientName: "Daniel Martinez", task: "Needs water", status: "In Progress", priority: "High" },

  { id: 11, patientName: "Ashley Moore", task: "Call family member", status: "Completed", priority: "High" },
  { id: 12, patientName: "Joshua Jackson", task: "Help sitting up", status: "Completed", priority: "Medium" },
  { id: 13, patientName: "Amanda White", task: "Check temperature", status: "Pending", priority: "Medium" },
  { id: 14, patientName: "Matthew Harris", task: "Needs oxygen adjustment", status: "In Progress", priority: "Medium" },
  { id: 15, patientName: "Olivia Martin", task: "Bathroom assistance", status: "Pending", priority: "Medium" },

  { id: 16, patientName: "James Thompson", task: "Needs water", status: "Pending", priority: "Medium" },
  { id: 17, patientName: "Sophia Garcia", task: "Feeling nauseous", status: "Pending", priority: "Medium" },
  { id: 18, patientName: "Ethan Rodriguez", task: "Pain medication request", status: "In Progress", priority: "Low" },
  { id: 19, patientName: "Isabella Martinez", task: "Adjust bed position", status: "Pending", priority: "Medium" },
  { id: 20, patientName: "Liam Hernandez", task: "Call nurse", status: "Pending", priority: "Medium" }
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
        <p>Priority: <strong>${request.priority}</strong></p>

        <label>Change Priority:</label>
        <select onchange="changePriority(${request.id}, this.value)">
        <option value="Low" ${request.priority === "Low" ? "selected" : ""}>Low</option>
        <option value="Medium" ${request.priority === "Medium" ? "selected" : ""}>Medium</option>
        <option value="High" ${request.priority === "High" ? "selected" : ""}>High</option>
        </select>
        <button onclick="markInProgress(${request.id})">
          Mark In Progress
        </button>
      `;
  
      requestContainer.appendChild(requestCard);
    });
  }

  function changePriority(requestId, newPriority){
    const request = requests.find(req=> req.id === requestId);
    request.priority = newPriority;
    displayRequests(requests);
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

  function filterByPriority(priority){
    const filteredRequests = requests.filter(request => request.priority === priority);
    displayRequests(filteredRequests)
  }
  function  showCompletedTasks(){
    const completed = requests.filter(req => req.status === "Completed")
    displayRequests(completed);
  }
  
  function filterByStatus(status)
  {
    const filteredRequests = requests.filter(request => request.status === status);
    displayRequests(filteredRequests);
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