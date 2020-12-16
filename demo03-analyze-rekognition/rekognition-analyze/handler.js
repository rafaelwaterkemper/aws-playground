'use strict';

const { promises: { readFile } } = require('fs')
const { get } = require('axios')

class Handler {
  constructor({ awsReko, awsTranslator }) {
    this.awsReko = awsReko
    this.awsTranslator = awsTranslator
  }

  async detectImageLabels(buffer) {
    const result = await this.awsReko.detectLabels({
      Image: {
        Bytes: buffer
      }
    }).promise()

    const workingItems = result.Labels
      .filter(({ Confidence }) => Confidence > 80);

    const names = workingItems
      .map(({ Name }) => Name)
      .join(' and ')
    return { names, workingItems }
  }

  async getImageBufferLocal(nameImage) {
    const buffer = await readFile('./pato.jpg')
    return buffer
  }

  async translateText(text) {
    const params = {
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'pt',
      Text: text
    }
    const { TranslatedText } = await this.awsTranslator
      .translateText(params)
      .promise()
    return TranslatedText.split(' e ')
  }

  formatTextResults(texts, workingItems) {

    const finalText = []
    for (const indexText in texts) {
      const nameInPortuguese = texts[indexText]
      const confidence = workingItems[indexText].Confidence;
      finalText.push(
        ` ${confidence.toFixed(2)}% de chance de ser do tipo ${nameInPortuguese}`

      )
    }
    return finalText.join('\n')
  }

  async getImageBuffer(imageUrl) {
    const response = await get(imageUrl, {
      responseType: 'arraybuffer'
    })
    const buffer = Buffer.from(response.data, 'base64')
    return buffer
  }

  async main(event) {
    try {
      // const buffer = await this.getImageBufferLocal('pato.jpg')
      const { imageUrl } = event.queryStringParameters;

      const buffer = await this.getImageBuffer(imageUrl)
      const { names, workingItems } = await this.detectImageLabels(buffer)
      const translatedText = await this.translateText(names);
      const formatted = this.formatTextResults(translatedText, workingItems)

      return {
        statusCode: 200,
        body: 'Traduzido \n'.concat(formatted)
      }
    } catch (error) {
      console.log(`Error ${error.message}`)
      return {
        statusCode: 500,
        body: 'Internal server error'
      }
    }
  }
}

//factory
const aws = require('aws-sdk')
const reko = new aws.Rekognition()
const translator = new aws.Translate()
const handler = new Handler({
  awsReko: reko,
  awsTranslator: translator
})


module.exports.main = handler.main.bind(handler);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };

