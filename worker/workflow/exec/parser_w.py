import xml.etree.ElementTree as ET
from pathlib import Path

path = Path.cwd()


def change_hocr(path,lista):
	tree = ET.parse(path)

	root = tree.getroot()

	tags = list({elem.tag for elem in tree.iter()})

	for elem in lista:
		for delem in root.iter('span'):
			if delem.get('id').find("line") != -1 and delem.get('id') == elem['id']:
				for i, word in enumerate(list(delem)):
						check_strong_em(word)
							


	tree.write(path)


def check_strong_em(word):
	try:
		for strong in word:
			for em in strong:
				if isinstance(em,str):
					em.text = elem['text'][i]
					old_conf = word.attrib['title']
					new_conf = old_conf.replace(old_conf.split(";")[1].split(" ")[2],str(elem['word_conf'][i]))
					word.set('title',new_conf)
	except:
			word.text = elem['text'][i]
			old_conf = word.attrib['title']
			new_conf = old_conf.replace(old_conf.split(";")[1].split(" ")[2],str(elem['word_conf'][i]))
			word.set('title',new_conf)

