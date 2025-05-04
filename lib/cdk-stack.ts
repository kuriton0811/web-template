import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// Import Lambda L2 construct
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class CdkHelloWorldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function resource
    const helloWorldFunction = new lambda.Function(this, "HelloWorldFunction", {
      runtime: lambda.Runtime.NODEJS_22_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset("lambda"), // Points to the lambda directory
      handler: "handler.handler", // Points to the 'hello' file in the lambda directory
    });

    // Env
    helloWorldFunction.addEnvironment("NODE_ENV", "production");

    // Layer
    const layer = new lambda.LayerVersion(this, "MyLayer", {
      code: lambda.Code.fromAsset("lambda/nodejs.zip"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
    });
    helloWorldFunction.addLayers(layer);

    // Define the API Gateway resource
    const api = new apigateway.LambdaRestApi(this, "HelloWorldApi", {
      handler: helloWorldFunction,
      proxy: false,
    });

    // Define the '/hello' resource with a GET method
    const helloResource = api.root.addResource("hello");
    helloResource.addMethod("GET");
    helloResource.addMethod("POST");
    helloResource.addMethod("PATCH");
    helloResource.addMethod("DELETE");
    helloResource.addMethod("PUT");

    // DynamoDB
    const table = new dynamodb.Table(this, "MyTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Policy
    helloWorldFunction.addEnvironment("TABLE_NAME", table.tableName);
    table.grantReadWriteData(helloWorldFunction);
  }
}
