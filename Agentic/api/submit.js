export default async function handler(req, res) {
    if (req.method === 'POST') {
        const data = req.body;
        
        // Log the submitted data to the Vercel Runtime Logs
        console.log('--- NEW FORM SUBMISSION ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('---------------------------');

        // Note for future development:
        // You can easily integrate this with Vercel KV, Vercel Postgres, or an external API here!

        // Send a success response back to the frontend
        return res.status(200).json({ 
            success: true, 
            message: 'Data successfully received by Vercel serverless function.',
            receivedData: data
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
