import json
from pathlib import Path
import shutil
from PIL import Image


def write_name(file):
	if check_name(file) == False:
		doc = make_doc(file)
		name = doc['name']
		update_data(name,doc)


def check_name(file):
	filename = str(file.parts[-1]) + ".JSON"
	path = Path.cwd()/"tmp"/filename
	return path.exists()



def make_doc(path):

	img = Image.open(path)
	pages_left = img.n_frames
	file = {}
	doc={}
	doc['split'] = pages_left
	doc['preprocess'] = pages_left
	doc['segment'] = pages_left
	doc['ocr'] = pages_left
	doc['compare'] = 1
	doc['merge'] = 1
	file['name'] = path.parts[-1]
	file['path'] = str(path)
	file['status'] = doc

	return file


def update_field(name,field,value):
	data = get_data(name)

	data['status'][field] = value

	update_data(name,data)


def get_field(name,field):
	data = get_data(name)

	return data['status'][field]


def delete_data(name):
	filename = str(name) + ".JSON"
	path = Path.cwd()/"tmp"/filename
	path.unlink()


def update_data(name,data):
	filename = str(name) + ".JSON"
	path = str(Path.cwd()/"tmp"/filename)
	with open(path,'w') as file:
		json.dump(data,file)


def get_data(name):
	filename = str(name) + ".JSON"
	path = Path.cwd()/"tmp"/filename
	with path.open() as file:
		data = json.load(file)
		return data


def delete_page(name,page):
	path = Path.cwd()/"tmp"/name/"pages"/"page_%s.tiff"%page
	path.unlink()


def delete_regions(name):
	path = Path.cwd()/"tmp"/name/"regions"
	for elem in path.glob("*.tiff"):
		elem.unlink()


def is_finished(name):
	data = get_data(name)
	source = Path(data['path'])
	destination = Path.cwd().parents[0]/"results"/name/name
	shutil.move(source,destination)


def parse_langs(langs):
	result = ""
	if isinstance(langs,tuple):
		for i in range(len(langs)):
			if i == 0:
				result = langs[i]
			else:
				result = result + "+" + langs[i]
	else:
		result = langs

	return result



