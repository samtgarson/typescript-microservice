import { RequestHandler, send } from 'micro'

const handler: RequestHandler = (req, res) => {
  send(res, 200, { beep: 'bloop' })
}

export default handler
