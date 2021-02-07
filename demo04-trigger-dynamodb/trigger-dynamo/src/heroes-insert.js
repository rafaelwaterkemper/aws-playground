const uuid = require('uuid')
const Joi = require('@hapi/joi')
const decoratorValidator = require('./util/decorator-validator')
const enumParams = require('./util/enum-params')

class Handler {
    constructor({ dynamoDbSvc }) {
        this.dynamoDbSvc = dynamoDbSvc
        this.dynamodbTable = process.env.DYNAMODB_TABLE
    }
    static validator() {
        return Joi.object({
            nome: Joi.string().max(100).min(2).required(),
            poder: Joi.string().max(20).required()
        })
    }
    async insertItem(params) {
        return this.dynamoDbSvc.put(params).promise()
    }
    prepareData(data) {
        const params = {
            TableName: this.dynamodbTable,
            Item: {
                ...data,
                id: uuid.v1(),
                createdAt: new Date().toISOString()
            }
        }
        return params
    }
    handlerSuccess(data) {
        const response = {
            statusCode: 200,
            body: JSON.stringify(data)
        }
        return response
    }
    handleError(data) {
        return {
            statusCode: data.statusCode || 501,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Couldn\'t create item!!'
        }
    }
    async main(event) {
        try {
            console.log('Caiu no main')
            // agora o decorator modifica o body e já
            // retorna no formato JSON
            const data = event.body
 
            const dbParams = this.prepareData(data)
            console.log('Preparou a data')
            await this.insertItem(dbParams)
            return this.handlerSuccess(dbParams.Item)
        } catch (error) {
            console.error('Deu ruim**', error.stack)
            return this.handleError({ statusCode: 500 })
        }
    }
}
//factory
const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()
const handler = new Handler({
    dynamoDbSvc: dynamoDB
})
module.exports = decoratorValidator(
    handler.main.bind(handler),
    Handler.validator(),
    enumParams.ARG_TYPE.BODY)