import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// Import Lambda L2 construct
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as path from "path";

export class CdkHelloWorldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function resource
    const helloWorldFunction = new lambda.Function(this, "HelloWorldFunction", {
      runtime: lambda.Runtime.NODEJS_22_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset("lambda"), // Points to the lambda directory
      handler: "handler.handler", // Points to the 'hello' file in the lambda directory
    });

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
      disableExecuteApiEndpoint: true,
    });

    // Define the '/hello' resource with a GET method
    const helloResource = api.root.addResource("hello");
    helloResource.addMethod("GET");
    helloResource.addMethod("POST");
    helloResource.addMethod("PATCH");
    helloResource.addMethod("DELETE");
    helloResource.addMethod("PUT");
    helloResource.addMethod("OPTIONS");
    helloResource.addMethod("HEAD");
    // DynamoDB
    const table = new dynamodb.Table(this, "MyTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Env
    helloWorldFunction.addEnvironment("NODE_ENV", "production");
    helloWorldFunction.addEnvironment("TABLE_NAME", table.tableName);

    // Policy
    table.grantReadWriteData(helloWorldFunction);

    const domain = api.url.split("//")[1];

    // CloudFront
    const distribution = new cloudfront.Distribution(this, "MyDistribution", {
      defaultBehavior: {
        origin: new origins.HttpOrigin(domain.split("/")[0]),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // Cognito
    // const userPool = new cognito.UserPool(this, "MyUserPool", {
    //   userPoolName: "MyUserPool",
    //   selfSignUpEnabled: true,
    //   signInAliases: {
    //     email: true,
    //   },
    //   lambdaTriggers: {
    //     postConfirmation: helloWorldFunction,
    //   },
    // });
    // const userPoolClient = new cognito.UserPoolClient(this, "MyUserPoolClient", {
    //   userPool,
    //   userPoolClientName: "MyUserPoolClient",
    //   authFlows: {
    //     adminUserPassword: true,
    //     userPassword: true,
    //     userSrp: true,
    //     custom: true,
    //   },
    //   generateSecret: false,
    // });
    // const identityPool = new cognito.CognitoCognito(this, "MyIdentityPool", {
    //   identityPoolName: "MyIdentityPool",
    //   allowUnauthenticatedIdentities: true,
    //   cognitoUserPools: [userPool],
    //   cognitoUserPoolClients: [userPoolClient],
    // });
    // const auth = new cognito.CognitoUserPoolDomain(this, "MyUserPoolDomain", {
    //   userPool,
    //   cognitoUserPoolDomainName: "my-user-pool-domain",
    // });
  }
}
