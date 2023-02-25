const form = document.querySelector('form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get the input values
    const name = form.elements.name.value;
    const address = form.elements.address.value;
    const resumeFile = form.elements.resume.files[0];

    // Create a new FormData object and add the input values to it
    const formData = new FormData();
    formData.append('name', name);
    formData.append('address', address);
    formData.append('resume', resumeFile);

    // Send the form data to the server using an AJAX request
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        console.log('File uploaded successfully!');
    } else {
        console.error('Error uploading file:', response.statusText);
    }
});