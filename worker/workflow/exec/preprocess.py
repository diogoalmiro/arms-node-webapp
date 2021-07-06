import os 
from tesserocr import PyTessBaseAPI, RIL
from PIL import Image
from pathlib import Path
import folderManager
import docManager
import cv2
import numpy as np

# Produces hocr file 
# Produces input image 
TESSDATA_PATH = str(Path.cwd().parents[0]/'tessdata')

def pre(image,langs):
	lang = docManager.parse_langs(langs)
	img = Image.open(image)

	with PyTessBaseAPI(path=TESSDATA_PATH, lang=lang) as api:
		api.SetImage(img)
		input_img = api.GetThresholdedImage()


	return input_img



def pre_process(name,langs,prep):
	folderManager.create_REG_TMP(name)
	path = Path.cwd()/"tmp"/name/"pages"
	destination = Path.cwd()/"tmp"/name/"regions"
	pages_left = docManager.get_field(name,'preprocess')

	for i in range(pages_left,0,-1):
		image = path/"page_{}.tiff".format(i)
		imgname = destination/str(image.stem+".tiff")

		input_img = pre(image,langs)

		if (prep):
			add_preprocess(image,imgname)
		else:
			input_img.save(str(imgname))

		
		docManager.update_field(name,'preprocess',(i-1))
		

def add_preprocess(img_path,img_name):
	image = cv2.imread(str(img_path))

	g = get_grayscale(image)
	rn = remove_noise(g)
	t = thresholding(rn)
	final = dilate(t)

	cv2.imwrite(str(img_name),final)


# get grayscale image
def get_grayscale(image):
    img = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return img
    
# noise removal
def remove_noise(image):
    img = cv2.medianBlur(image,5)
    return img
 
#thresholding
def thresholding(image):
    img = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    return img

#dilation
def dilate(image):
    kernel = np.ones((5,5),np.uint8)
    img = cv2.dilate(image, kernel, iterations = 1)
    return img
   
