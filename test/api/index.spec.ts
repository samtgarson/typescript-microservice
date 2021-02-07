import Index from '@/api/index'
import { VercelRequest, VercelResponse } from '@vercel/node'

describe('index', () => {
  it('is a robot', async () => {
    const req = {} as VercelRequest
    const res = { json: jest.fn() } as unknown as VercelResponse

    await Index(req, res)

    expect(res.json).toHaveBeenCalledWith({ beep: 'bloop' })
  })
})
