import { listCustomers } from '../models/CustomerModel.js'

export async function getCustomers(req, res) {
  res.json(await listCustomers())
}
