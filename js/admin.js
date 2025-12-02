document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('property-form');
    const outputContainer = document.getElementById('output-container');
    const jsonOutput = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-btn');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Generate a random ID (simple timestamp based)
        const id = Date.now();

        const property = {
            id: id,
            title: document.getElementById('title').value,
            price: document.getElementById('price').value,
            location: document.getElementById('location').value,
            description: document.getElementById('description').value,
            image: document.getElementById('image').value,
            status: document.getElementById('status').value
        };

        // Format JSON with indentation
        const jsonString = JSON.stringify(property, null, 2);
        
        // Display output
        jsonOutput.textContent = jsonString + ','; // Add comma for convenience
        outputContainer.style.display = 'block';
        
        // Scroll to output
        outputContainer.scrollIntoView({ behavior: 'smooth' });
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = jsonOutput.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '¡Copiado!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
    });
});