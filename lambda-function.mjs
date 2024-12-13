import AWS from 'aws-sdk';

const sqs = new AWS.SQS();

const QUEUE_URL = https://sqs.us-east-1.amazonaws.com/576677714530/cs5250-requests;

const validateWidgetRequest = (request) => {
  const requiredFields = ["action", "widgetType", "quantity"];
  
  if (!["create", "update", "delete"].includes(request.action)) {
    throw new Error("Invalid action. Must be 'create', 'update', or 'delete'.");
  }

  if (request.action === "create" || request.action === "update") {
    requiredFields.forEach((field) => {
      if (!request[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    if (typeof request.quantity !== "number" || request.quantity <= 0) {
      throw new Error("Quantity must be a positive number.");
    }
  }

  if (request.action === "delete" && !request.id) {
    throw new Error("Delete action requires an 'id' field.");
  }
};


const sendToQueue = async (messageBody) => {
  const params = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(messageBody),
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log(`Message sent to SQS: ${result.MessageId}`);
    return result.MessageId;
  } catch (error) {
    console.error(`Failed to send message to SQS: ${error.message}`);
    throw new Error("Failed to send message to the queue.");
  }
};

export const handler = async (event) => {
  try {
    
    const requestBody = JSON.parse(event.body);
    console.log("Received request:", requestBody);

    validateWidgetRequest(requestBody);

    const messageId = await sendToQueue(requestBody);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Request processed successfully",
        messageId: messageId,
      }),
    };
  } catch (error) {
    console.error("Error processing request:", error.message);

    return {
      statusCode: error.message.includes("Missing required field")
        ? 400
        : 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};

