# 1 passo: Criar arquivo de política de segurança

# {
#     "Version": "2012-10-17",
#     "Statement": [
#         {
#              "Effect": "Allow",
#              "Principal": {
#                  "Service": "lambda.amazonaws.com"
#              },
#              "Action": "sts:AssumeRole"
#         }
#     ]
# }    

# 2 passo: Criar roles de segurança da AWS (IAM

aws iam create-role \
    --role-name lambda-exemplo \
    --assume-role-policy-document file://politicas.json \
    | tee logs/role.log

# Criar arquivo com a função e zipa-lo    

# async function handler(event, context) {
#     console.log('Ambiente..', JSON.stringify(process.env, null, 2))
#     console.log('Evento', JSON.stringify(event, null, 2))

#     return {
#         hello: 'world'
#     }
# }

# module.exports = {
#     handler = handler
# }

zip function.zip index.js

# Criar lambda function

aws lambda create-function \
    --function-name hello-cli \
    --zip-file fileb://function.zip \
    --handler index.handler \
    --runtime nodejs12.x \
    --role arn:aws:iam::354065237179:role/lambda-exemplo \
    | tee logs/create-function.log

# Invocar a lambda

aws lambda invoke \
    --function-name hello-cli \
    --log-type Tail \
    logs/lambda-exec.log

# Atualizar a lambda
# zipar novamente
aws lambda update-function-code \
    --zip-file fileb://function.zip \
    --function-name hello-cli \
    --publish \
    | tee logs/update-function.log

# Remover function

aws lambda delete-function \
    --function-name hello-cli

# Remover iam role
aws iam delete-role \
    --role-name lambda-exemplo