// Function to handle file selection and display the uploaded image
function handleFileSelect() {
  const fileInput = document.getElementById("imageInput");
  const uploadedImage = document.getElementById("uploadedImage");

  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedImage.src = e.target.result;
      uploadedImage.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    uploadedImage.style.display = "none";
  }
}
// Function to delete a row from the table
function deleteRow(index) {
  const table = document.querySelector("table");
  table.deleteRow(index + 1); // +1 to account for the header row
}

// Function to add a new row to the table
function addRow() {
  const table = document.querySelector("table");
  const newRow = table.insertRow(-1); // -1 inserts at the end
  newRow.innerHTML = `
    <td><input type="text" name="category"></td>
    <td><input type="text" name="percentage"></td>
    <td class="delete-btn" onclick="deleteRow(this.parentNode.rowIndex - 1)">Delete</td>
  `;
}

// Function to gather data from the table and submit as JSON
function submitData() {
  const table = document.querySelector("table");
  const rows = table.querySelectorAll("tr");
  const data = [];
  let totalPercentage = 0;

  for (let i = 1; i < rows.length; i++) {
    // Start from 1 to skip the header row
    const row = rows[i];
    const [riceInput, percentInput] = row.querySelectorAll("input");
    const riceCategory = riceInput.value;
    const percentage = parseInt(percentInput.value);

    if (riceCategory.trim() === "" || isNaN(percentage) || percentage <= 0) {
      alert("Please enter valid data for all rows.");
      return;
    }

    data.push({ riceCategory, percentage });
    totalPercentage += percentage;
  }

  if (totalPercentage !== 100) {
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "block";
    return;
  } else {
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "none";
  }

  console.log(JSON.stringify(data));
  // You can now use the 'data' variable to send the JSON to the server or perform any other action.

  // Send the JSON data to the server using a POST request
  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];
  if (file) {
    formData.append("image", file);
  }

  fetch("/submit", {
    method: "POST",
    body: formData
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // Display the response from the server
      // Handle the response as needed
      alert("Uploaded Successfully !");
      window.location.reload(); // Reload the page after successful upload
    })
    .catch((error) => {
      // Handle errors, if any
      console.error("Error:", error);
      alert("Error:", error);
    });
}
