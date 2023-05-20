import config from '../knexfile'
import { knex as setupKnex } from 'knex'

export const knex = setupKnex(config)
