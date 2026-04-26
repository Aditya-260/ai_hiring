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

    labels_this_frame = []

    height, width, channels = frame.shape

    blob = cv2.dnn.blobFromImage(frame, 0.00392, (416,416), (0,0,0), True, crop=False)

    net.setInput(blob)
    outs = net.forward(output_layers)

    class_ids = []
    confidences = []
    boxes = []

    for out in outs:
        for detection in out:
            scores = detection[5:]
            class_id = np.argmax(scores)
            confidence = scores[class_id]

            if confidence > 0.10:
                center_x = int(detection[0]*width)
                center_y = int(detection[1]*height)

                w = int(detection[2]*width)
                h = int(detection[3]*height)

                x = int(center_x - w/2)
                y = int(center_y - h/2)

                boxes.append([x,y,w,h])
                confidences.append(float(confidence))
                class_ids.append(class_id)

    indexes = cv2.dnn.NMSBoxes(boxes, confidences, 0.10, 0.4)

    for i in range(len(boxes)):
        if i in indexes:
            x, y, w, h = boxes[i]
            label = str(label_classes[class_ids[i]])

            # Flag every single detected object — no exceptions
            labels_this_frame.append((label, confidences[i]))

            # Draw box: red for persons, orange for everything else
            color = (0, 0, 255) if label == "person" else (0, 165, 255)
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            cv2.putText(frame, f"{label} {confidences[i]:.2f}", (x, max(20, y - 10)), font, 1.5, color, 2)

    return labels_this_frame