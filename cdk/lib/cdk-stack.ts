import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// Import Lambda L2 construct
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as path from "path";

export class CdkHelloWorldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Lambda function resource
    const helloWorldFunction = new lambda.Function(this, "HelloWorldFunction", {
      runtime: lambda.Runtime.NODEJS_22_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset("lambda"), // Points to the lambda directory
      handler: "index.handler", // Points to the 'hello' file in the lambda directory
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
    const helloResource = api.root.addResource("api");
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

    // S3 Bucket
    const bucket = new s3.Bucket(this, "MyBucket", {
      bucketName: "mybucket-009032819614",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: "index.html",
    });

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${bucket.bucketArn}/*`],
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
      })
    );

    // API Behavior
    const apiBehavior = {
      origin: new origins.HttpOrigin(domain.split("/")[0]),
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    // Frontend Behavior
    const frontendBehavior = {
      origin: new origins.S3Origin(bucket),
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      compress: true,
      defaultTtl: cdk.Duration.days(1),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.days(365),
      originRequestPolicy: new cloudfront.OriginRequestPolicy(
        this,
        "MyOriginRequestPolicy",
        {
          cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
          // headerBehavior:
          //   cloudfront.OriginRequestHeaderBehavior.allowList("Authorization"),
          queryStringBehavior:
            cloudfront.OriginRequestQueryStringBehavior.all(),
        }
      ),
    };

    // CloudFront
    const distribution = new cloudfront.Distribution(this, "MyDistribution", {
      defaultBehavior: frontendBehavior,
      additionalBehaviors: {
        "/api/*": apiBehavior,
      },
    });
  }
}
