document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM content loaded");

  function getRequestDigest() {
    return document.getElementById("__REQUESTDIGEST").value;
  }

  const siteUrl = "https://computacenter.sharepoint.com/sites/RMGTeamLeadCollab";
  const listName = "Breaksheet Database";

  function fetchBookedTimeSlots() {
    return fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json;odata=verbose'
      }
    })
    .then(response => response.json())
    .then(data => data.d.results)
    .catch(error => console.error('Error fetching data:', error));
  }

  function addBookingToSharePoint(day, employee, startTime1, endTime1, startTime2, endTime2) {
    const data = {
      __metadata: { type: "SP.Data.Breaksheet_x0020_DatabaseListItem" },
      Title: employee,
      Day: day,
      StartTime1: startTime1,
      EndTime1: endTime1,
      StartTime2: startTime2,
      EndTime2: endTime2
    };

    return fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': getRequestDigest()
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => console.log('Data added:', data))
    .catch(error => console.error('Error adding data:', error));
  }

  function clearBookedTimeSlotsIfNewDay() {
    const today = new Date().toLocaleDateString();
    const lastDate = localStorage.getItem("lastDate");
    if (today !== lastDate) {
      fetch(`${siteUrl}/_api/web/lists/getbytitle('${listName}')/items`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'X-RequestDigest': getRequestDigest()
        }
      }).then(() => {
        console.log('All bookings cleared for a new day.');
        localStorage.setItem("lastDate", today);
      }).catch(error => console.error('Error clearing data:', error));
    }
  }

  function updateBookedLunchBreaksTable() {
    console.log("Updating booked lunch breaks table");
    fetchBookedTimeSlots().then(bookedTimeSlots => {
      bookedTimeSlots.sort((a, b) => {
        const startTimeA = new Date(`2000-01-01T${a.StartTime1}`);
        const startTimeB = new Date(`2000-01-01T${b.StartTime1}`);
        return startTimeA - startTimeB;
      });

      const tableBody = document.getElementById("booked-lunch-breaks-table").getElementsByTagName("tbody")[0];
      tableBody.innerHTML = "";

      bookedTimeSlots.forEach(timeSlot => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = timeSlot.Day;
        row.insertCell(1).textContent = timeSlot.Title;
        row.insertCell(2).textContent = timeSlot.StartTime1;
        row.insertCell(3).textContent = timeSlot.EndTime1;
        row.insertCell(4).textContent = timeSlot.StartTime2 || 'N/A';
        row.insertCell(5).textContent = timeSlot.EndTime2 || 'N/A';
        row.classList.add("booked");
      });

      updateAvailableSlotsDashboard();
    });
  }

  function updateAvailableSlotsDashboard() {
    const limits = {
      "09:00": 2,
      "09:30": 2,
      "10:00": 2,
      "10:30": 2,
      "11:00": 2,
      "11:30": 2,
      "12:00": 3,
      "12:30": 3,
      "13:00": 3,
      "13:30": 3,
      "14:00": 3,
      "14:30": 3,
      "15:00": 3,
      "15:30": 3,
      "16:00": 3,
      "16:30": 2,
      "17:00": 2,
      "17:30": 2,
      "18:00": 2
    };

    const timeRanges = {
      "09:00": [new Date("2000-01-01T09:00:00"), new Date("2000-01-01T09:30:00")],
      "09:30": [new Date("2000-01-01T09:30:00"), new Date("2000-01-01T10:00:00")],
      "10:00": [new Date("2000-01-01T10:00:00"), new Date("2000-01-01T10:30:00")],
      "10:30": [new Date("2000-01-01T10:30:00"), new Date("2000-01-01T11:00:00")],
      "11:00": [new Date("2000-01-01T11:00:00"), new Date("2000-01-01T11:30:00")],
      "11:30": [new Date("2000-01-01T11:30:00"), new Date("2000-01-01T12:00:00")],
      "12:00": [new Date("2000-01-01T12:00:00"), new Date("2000-01-01T12:30:00")],
      "12:30": [new Date("2000-01-01T12:30:00"), new Date("2000-01-01T13:00:00")],
      "13:00": [new Date("2000-01-01T13:00:00"), new Date("2000-01-01T13:30:00")],
      "13:30": [new Date("2000-01-01T13:30:00"), new Date("2000-01-01T14:00:00")],
      "14:00": [new Date("2000-01-01T14:00:00"), new Date("2000-01-01T14:30:00")],
      "14:30": [new Date("2000-01-01T14:30:00"), new Date("2000-01-01T15:00:00")],
      "15:00": [new Date("2000-01-01T15:00:00"), new Date("2000-01-01T15:30:00")],
      "15:30": [new Date("2000-01-01T15:30:00"), new Date("2000-01-01T16:00:00")],
      "16:00": [new Date("2000-01-01T16:00:00"), new Date("2000-01-01T16:30:00")],
      "16:30": [new Date("2000-01-01T16:30:00"), new Date("2000-01-01T17:00:00")],
      "17:00": [new Date("2000-01-01T17:00:00"), new Date("2000-01-01T17:30:00")],
      "17:30": [new Date("2000-01-01T17:30:00"), new Date("2000-01-01T18:00:00")],
      "18:00": [new Date("2000-01-01T18:00:00"), new Date("2000-01-01T18:30:00")]
    };

    fetchBookedTimeSlots().then(bookedTimeSlots => {
      const availableSlots = { ...limits };

      bookedTimeSlots.forEach(timeSlot => {
        const startTimes = [timeSlot.StartTime1, timeSlot.StartTime2];
        const endTimes = [timeSlot.EndTime1, timeSlot.EndTime2];
        startTimes.forEach(start => {
          endTimes.forEach(end => {
            if (start && end) {
              const startDate = new Date(`2000-01-01T${start}`);
              const endDate = new Date(`2000-01-01T${end}`);
              for (const time in timeRanges) {
                const [rangeStart, rangeEnd] = timeRanges[time];
                if (startDate < rangeEnd && endDate > rangeStart) {
                  availableSlots[time]--;
                  if (availableSlots[time] <= 0) {
                    delete availableSlots[time];
                  }
                }
              }
            }
          });
        });
      });

      const dashboard = document.getElementById('available-slots-dashboard');
      dashboard.innerHTML = '';

      for (const [time, slots] of Object.entries(availableSlots)) {
        const slotElement = document.createElement('div');
        slotElement.className = 'available-slot';
        slotElement.textContent = `${time} - ${slots} slots available`;
        dashboard.appendChild(slotElement);
      }
    });
  }

  document.getElementById("add-booking-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const form = event.target;
    const day = form.querySelector("#day").value;
    const employee = form.querySelector("#employee").value;
    const startTime1 = form.querySelector("#start-time-1").value;
    const endTime1 = form.querySelector("#end-time-1").value;
    const startTime2 = form.querySelector("#start-time-2").value;
    const endTime2 = form.querySelector("#end-time-2").value;

    addBookingToSharePoint(day, employee, startTime1, endTime1, startTime2, endTime2).then(() => {
      updateBookedLunchBreaksTable();
    });
  });

  // Function to get the request digest value from SharePoint
function getRequestDigest() {
  return $.ajax({
    url: _spPageContextInfo.webAbsoluteUrl + "/_api/contextinfo",
    type: "POST",
    headers: {
      "Accept": "application/json;odata=verbose"
    },
    success: function(data) {
      var requestDigest = data.d.GetContextWebInformation.FormDigestValue;
      $('#__REQUESTDIGEST').val(requestDigest);
    },
    error: function(error) {
      console.error("Error fetching request digest:", error);
    }
  });
}

// Call this function when the page loads to ensure the request digest is available
$(document).ready(function() {
  getRequestDigest();
});

  clearBookedTimeSlotsIfNewDay();
  updateBookedLunchBreaksTable();
});