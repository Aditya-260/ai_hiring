import cv2
import numpy as np
import time

#net has the YOLO loaded
net = cv2.dnn.readNet("object_detection_model/weights/yolov3-tiny.weights", "object_detection_model/config/yolov3-tiny.cfg")

#classes that we have to detect using Object Detection Model
label_classes = []

with open("object_detection_model/objectLabels/coco.names","r") as file:
    label_classes = [name.strip() for name in file.readlines()]

layer_names = net.getLayerNames()
# print(type(layer_names))
# layer_names = [i for i in layer_names]
# print(type(layer_names))
output_layers = [layer_names[layer-1] for layer in net.getUnconnectedOutLayers()]

colors = np.random.uniform(0,255,size=(len(label_classes),3))

font = cv2.FONT_HERSHEY_PLAIN
start_time = time.time()
frame_id = 0

def detectObject(frame):

    # Only flag these specific items as cheating materials or extra people.
    # YOLOv3-tiny frequently misclassifies smartphones as "remote".
    SUSPICIOUS_CLASSES = {"cell phone", "remote", "book", "laptop", "person"}

    labels_this_frame = []

    height, width, channels = frame.shape

    blob = cv2.dnn.blobFromImage(frame, 0.00392, (320,320), (0,0,0), True, crop=False)

    #Feeding Blob as an input to our Yolov3-tiny model
    net.setInput(blob)

    #Output labels received at the output of model
    outs = net.forward(output_layers)

    #show informations on the screen
    class_ids = []
    confidences = []
    boxes = []

    for out in outs:
        for detection in out:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]

            if confidence > 0.2:  # lowered from 0.3 for better phone/book detection

                #object detected
                center_x = int(detection[0]*width)
                center_y = int(detection[1]*height)

                w = int(detection[2]*width)
                h = int(detection[3]*height)

                #rectangle co-ordinates
                x = int(center_x - w/2)
                y = int(center_y - h/2)

                boxes.append([x,y,w,h])
                confidences.append(float(confidence))
                class_ids.append(class_id)

    indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.3, 0.4)

    for i in range(len(boxes)):
        if i in indexes:
            #show the box only if it comes in non-max supression box
            x, y, w, h = boxes[i]
            label = str(label_classes[class_ids[i]])
            
            # Only return the label if it's considered suspicious
            if label in SUSPICIOUS_CLASSES:
                # If YOLO thinks it's a remote, it's almost certainly a phone in this context
                if label == "remote":
                    label = "cell phone (detected as remote)"
                
                labels_this_frame.append((label, confidences[i]))
                
                # DRAW ON THE FRAME FOR DEBUGGING
                color = (0, 0, 255) if "phone" in label else (0, 255, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, f"{label} {confidences[i]:.2f}", (x, max(20, y - 10)), font, 1.5, color, 2)

    return labels_this_frame