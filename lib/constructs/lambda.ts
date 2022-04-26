import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, LogGroupProps, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import merge from "lodash.merge";

interface Props extends Omit<NodejsFunctionProps, ""> {
  logGroupProps?: Omit<LogGroupProps, "logGroupName">;
}

const defaults: Partial<Props> = {
  runtime: lambda.Runtime.NODEJS_16_X,
  memorySize: 256,
  timeout: Duration.seconds(10),
  bundling: {
    externalModules: ["aws-sdk"],
  },
  architecture: Architecture.ARM_64,
};

export class Lambda extends NodejsFunction {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, merge({}, defaults, props));
    new LogGroup(
      this,
      `${id}LogGroup`,
      merge(
        {},
        {
          logGroupName: "/aws/lambda/" + this.functionName, // connects log group to lambda
          retention: RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        },
        props.logGroupProps
      )
    );
  }
}
