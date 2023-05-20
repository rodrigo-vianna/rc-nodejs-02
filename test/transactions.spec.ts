import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit',
    })

    const cookies = response.get('Set-Cookie')
    await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)
      .expect((response) => {
        expect(response.body.transactions).toHaveLength(1)
        expect(response.body.transactions).toEqual([
          expect.objectContaining({
            id: expect.any(String),
            amount: 5000,
            title: 'New transaction',
          }),
        ])
      })
  })

  it('should be able to get a specific transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 5000,
      type: 'credit',
    })

    const cookies = response.get('Set-Cookie')
    const listTransactionResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    const transactionId = listTransactionResponse.body.transactions[0].id

    await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)
      .expect((response) => {
        expect(response.body.transaction).toEqual(
          expect.objectContaining({
            id: transactionId,
            amount: 5000,
            title: 'New transaction',
          }),
        )
      })
  })

  it('should be able to get the summary', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'Credit transaction',
      amount: 5000,
      type: 'credit',
    })
    const cookies = response.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)
      .expect((response) => {
        expect(response.body.summary).toEqual({
          amount: 3000,
        })
      })
  })
})
