export async function GET() {
  try {
    await fetch('https://stockdashboard-production-91be.up.railway.app')
    return Response.json({ status: 'pinged', time: new Date().toISOString() })
  } catch (error) {
    return Response.json({ status: 'failed', error: String(error) })
  }
}