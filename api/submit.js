export default async function handler(req, res) {
    if (req.method === 'POST') {
        const submission = req.body;

        // Add your form submission saving logic here.
        // For example, you could save it to a database.

        res.status(200).json({ message: 'Submission received', data: submission });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}