const { request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const custumers = [];

/**
 *cpf: string;
 *name: string;
 *id: uuid;
 *statement: [];
*/

function verifyIfExistsAcountCpf(req, res, next) {
  const { cpf } = req.headers;

  const customer = custumers.find(customer => customer.cpf === cpf);

  if(!customer){
    return res.status(400).json({error: "Customer not found"})
  }

  req.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, op) => {
    if(op.type === 'credit'){
      return acc + op.amount;
    } else {
      return acc - op.amount; 
    }
  }
  , 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = custumers.some(
    (customer) => customer.cpf === cpf
  ); 

  if(customerAlreadyExists){
    return response.status(400).json({error: "Customer already exists!"})
  }

  custumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send()
    
})

app.get("/statement",verifyIfExistsAcountCpf, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
})

app.post('/deposits', verifyIfExistsAcountCpf, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request;

  const statementOperations = {
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperations);

  return response.status(201).send()
});

app.post('/withdraw', verifyIfExistsAcountCpf, (request, response) => {
  const { amount } = request.body;
  
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount) {
    return response.status(400).json({ error: "Insufficient founds"})
  }

  const statementOperations = {
    amount,
    createdAt: new Date(),
    type: 'debit',
  }

  customer.statement.push(statementOperations);
  return response.status(201).send()
})

app.listen(3333);