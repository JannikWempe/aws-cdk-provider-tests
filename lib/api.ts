import { RemovalPolicy } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";
import { Lambda } from "./constructs/lambda";

export class Api extends Construct {
  public readonly url: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const table = new Table(this, "NotesTable", {
      partitionKey: {
        name: "id",
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const handler = new Lambda(this, "ApiHandler", {
      entry: path.join(__dirname, "handler", "api", "index.ts"),
      environment: {
        NOTES_TABLE_NAME: table.tableName,
      },
    });

    table.grantReadWriteData(handler);

    const api = new LambdaRestApi(this, "Api", {
      handler,
      proxy: false,
    });
    const notes = api.root.addResource("notes");
    notes.addMethod("POST");
    const note = notes.addResource("{id}");
    note.addMethod("GET");
    note.addMethod("DELETE");

    // to proof updated / rolled back API
    const monitoring = api.root.addResource("monitoring").addResource("info");
    monitoring.addMethod("GET");

    this.url = api.url;
  }
}
