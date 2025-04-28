from io import BytesIO

import numpy as np
from PIL import Image
from fastapi import FastAPI,File,UploadFile
import tensorflow as tf
import uvicorn
app = FastAPI()
MODEL = tf.keras.models.load_model('../saved_models/1')
CLASS_NAMES=["Early Blight","Late Blight","Healthy"]
@app.get("/ping")
async  def ping():
    return {"Hello Worls I'm Alive My name is ghofrane fatnassi"}
def read_file_as_image(data) ->np.ndarray:
    image = np.array(Image.open(BytesIO(data)))
    return image
@app.post("/predict")
async def predict(
        file: UploadFile = File(...)
):
    image = read_file_as_image(await file.read())
    img_batch = np.expand_dims(image, 0)
    predictions = MODEL.predict(img_batch)
    predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
    confidence = np.max(predictions[0])
    return {
        "confidence": float(confidence),
        "class": predicted_class
    }

    pass
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)