from bs4 import BeautifulSoup as bs
import sys
import json

def get_areas(file):
	info = []
	with open(file,"r") as f:
		content = f.read()
		bs_content = bs(content,'xml')
		x = bs_content.find_all("div",{"class":"ocr_carea"})
		for area in x:
			dic = {}
			bbox = area['title']
			coords = bbox.split()
			del coords[0]
			dic['id'] = area['id']
			dic['bbox'] = coords
			info.append(dic)

	return info



def get_lines(file,area):
	info = []
	with open(file,"r") as f:
		content = f.read()
		bs_content = bs(content,'xml')
		x = bs_content.find("div",{"id": area}).find_all("span",{"class":"ocr_line"})
		for line in x:
			dic = {}
			bbox = line['title']
			coords = bbox.split(";")[0].split()
			del coords[0]
			dic['id'] = line['id']
			dic['bbox'] = decode_int(coords)
			dic['text'] = get_textline(file,area,line['id'])
			dic['word_conf'] = decode_int(get_confs(file,area,line['id']))
			info.append(dic)

	return info


def get_confs(file,area,line):
	info = []
	with open(file,"r") as f:
		content = f.read()
		bs_content = bs(content,'xml')
		x = bs_content.find("div",{"id": area}).find("span",{"id": line}).find_all("span",{"class": "ocrx_word"})
		for word in x:
			conf = word['title'].split(";")[1].split()[1]
			info.append(conf)

	return info

	

def get_words(file,area,line):
	info = []
	with open(file,"r") as f:
		content = f.read()
		bs_content = bs(content,'xml')
		x = bs_content.find("div",{"id": area}).find("span",{"id": line}).find_all("span",{"class": "ocrx_word"})
		for word in x:
			dic = {}
			dic['id'] = word['id']
			dic['word'] = word.get_text()
			dic['conf'] = word['title'].split(";")[1].split()[1]
			info.append(dic)

	return info


###################### AUX ################################


def get_textline (file,area,line):
	text = []
	words = get_words(file,area,line)
	for word in words:
		text.append(word['word'])

	return text


def decode_int(elements):
	new = []
	for elem in elements:
		new.append(int(elem))
	return new

#if __name__ == "__main__":
#	x = []
#	if len(sys.argv) == 1 or len(sys.argv) > 4:
#		print("Invalid command")
#	if len(sys.argv) == 2:
#		x = get_areas(sys.argv[1])
#	if len(sys.argv) == 3:
#		x = get_lines(sys.argv[1],sys.argv[2])
#	if len(sys.argv) == 4:
#		x = get_words(sys.argv[1],sys.argv[2],sys.argv[3])
#
#	with open('result.json', 'w') as fp:
#		json.dump(x, fp)
#
#	sys.exit(1)


