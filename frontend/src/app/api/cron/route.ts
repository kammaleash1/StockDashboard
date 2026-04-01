export async function GET() {
  try {
    await fetch('https://stockdashboard-y748.onrender.com/')
    return Response.json({ status: 'pinged', time: new Date().toISOString() })
  } catch (error) {
    return Response.json({ status: 'failed', error: String(error) })
  }
}