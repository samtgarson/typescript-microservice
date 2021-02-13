/*
 * Stolen from:
 * https://github.com/vercel/micro-dev/blob/master/lib/log.js
 */

/* eslint-disable import/no-extraneous-dependencies */
import { VercelApiHandler, VercelRequest, VercelResponse } from '@vercel/node'
import chalk from 'chalk'
import jsome from 'jsome'
import PrettyError from 'pretty-error'
import stringLength from 'string-length'

const pe = new PrettyError()

type ResponseWithError = VercelResponse & { _error?: Error }

jsome.colors = {
	'num': 'cyan',
	'str': 'green',
	'bool': 'red',
	'regex': 'blue',
	'undef': 'grey',
	'null': 'grey',
	'attr': 'reset',
	'quot': 'reset',
	'punc': 'reset',
	'brack': 'reset'
}

const logLine = (message: string, date: Date) => {
	const dateString = `${chalk.grey(date.toLocaleTimeString())}`
	let logSpace =
    process.stdout.columns - stringLength(message) - stringLength(dateString)

	if (logSpace <= 0) {
		logSpace = 10
	}

	console.log(`${message}${' '.repeat(logSpace)}${dateString}\n`)
}

const logRequest = async (
  req: VercelRequest,
  start: Date,
  requestIndex: number
) => {
	logLine(`> #${requestIndex} ${chalk.bold(req.method)} ${req.url}`, start)

  const contentLength = req.headers['content-length'] ?? 0 as number
  const contentType = req.headers['content-type'] as string
	if (contentLength > 0 && contentType.indexOf('application/json') === 0) {
		try {
			jsome(req.body)
			console.log('')
		} catch (err) {
			console.log(`JSON body could not be parsed: ${err.message} \n`)
		}
	}
}

const logStatusCode = (statusCode: number) => {
	if (statusCode >= 500) {
		return chalk.red(statusCode)
	}

	if (statusCode >= 400 && statusCode < 500) {
		return chalk.yellow(statusCode)
	}

	if (statusCode >= 300 && statusCode < 400) {
		return chalk.blue(statusCode)
	}

	if (statusCode >= 200 && statusCode < 300) {
		return chalk.green(statusCode)
	}

	return statusCode
}

const logResponse = async (
  res: ResponseWithError,
  end: string,
  endTime: Date,
  requestIndex: number,
  chunk: string
) => {
	const statusCode = logStatusCode(res.statusCode)

	logLine(`< #${requestIndex} ${statusCode} [+${end}]`, endTime)

  if (res._error) {
		console.log(pe.render(res._error))
		return
	}

	try {
		const str = JSON.parse(chunk)
		jsome(str)
	} catch (err) {
		if (typeof chunk === 'string') {
			console.log(`${chunk.substr(0, 100)}${chunk.length > 100 ? '...' : ''}`)
		}
	}
}

let requestCounter = 0

const initLog = (req: VercelRequest, res: ResponseWithError) => {
	const start = new Date()
	const requestIndex = ++requestCounter

	console.log(chalk.grey(`\n${'—'.repeat(process.stdout.columns)}\n`))

	const reqBodyReady = logRequest(req, start, requestIndex)

	const end = res.end

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
	// eslint-disable-next-line promise/prefer-await-to-callbacks
	res.end = (chunk: string, encoding: BufferEncoding, callback?: () => void) => {
		res.end = end
		const endTime = new Date()
		const delta = endTime.valueOf() - start.valueOf()
		const requestTime =
      delta < 10000 ? `${delta}ms` : `${Math.round(delta / 1000)}s`

		// eslint-disable-next-line promise/prefer-await-to-then
		reqBodyReady.then(() =>
			logResponse(
				res,
				requestTime,
				endTime,
				requestIndex,
				chunk
			))

		res.end(chunk, encoding, callback)
	}

  return { req, res }
}

export default (fn: VercelApiHandler) => async (req: VercelRequest, res: VercelResponse): Promise<void> => {
	const { req: logReq, res: logRes } = initLog(req, res)

	try {
		return fn(logReq, logRes)
	} catch (err) {
		console.log(err)
		const { statusCode = 500, stack } = err
		return res.status(statusCode).end(stack)
	}
}
