from pathlib import Path
import parser_r as pr
import parser_w as pw
import json
import docManager
import folderManager
import shutil

def get_ocr(name):
	path = Path.cwd()/"tmp"/name/"regions"/"regions.JSON"
	with open(path,"rb") as file:
		data = json.load(file)
		return data


def get_hocr(name,page):
	lines = []
	areas = pr.get_areas(page)
	for area in areas:
		line = pr.get_lines(page,area['id'])
		for element in line:
			lines.append(element)
	return lines


def compare(name,page):
	aux = get_ocr(name)
	d1 = get_hocr(name,page)
	new_d1 = []

	image = str(page.stem) + ".tiff"

	for page in aux:
		if page['image'] == image:
			d2 = page['regions']

	for i in d1:
		for h in d2:
			if i['bbox'] == h['bbox'] and (i['word_conf'] != h['word_conf']):
				
				best = [max(value) for value in zip(i['word_conf'],h['word_conf'])]
				for r in range(len(best)):
					if best[r] == h['word_conf'][r]:
						i['text'][r] = h['text'][r] 
						i['word_conf'][r] = h['word_conf'][r]

				new_d1.append(i)

			elif  i['bbox'] == h['bbox'] and (i['word_conf'] == h['word_conf']):

				new_d1.append(i)

	return new_d1


def modify(name,tmp):
	path = Path.cwd()/"tmp"/name/"pages"
	for page in path.glob("*.hocr"):
		changes = compare(name,page)
		pw.change_hocr(page,changes)


	#	if correction:
	#		candidates(name,changes,average)
		if not tmp:
			docManager.delete_regions(name)


					

def candidates(name,regions,average):
	folderManager.create_CORRECTION(name)
	candidates = []
	filenames = []
	destination = str(Path.cwd()/"tmp"/name/"correction")
	all_pages = get_ocr(name)
	
	for element in regions:
		if sum(element['word_conf'])/len(element['word_conf']) < average:
			candidates.append(element['id'])


	for page in all_pages:
		for region in page['regions']:
			if region['id'] in candidates:
				filenames.append(regions['filename'])

	for element in filenames:
		file = element.split("/")[-1]
		shutil.move(element,destination+file)



