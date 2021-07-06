
#!/usr/bin/env python3

# Splits TIFF file into its different pages 
# Input: name of the file to be splitted (must be TIFF)
# Output: page_n.tiff (where n corresponds to the number of the page).

from PIL import Image
from pathlib import Path
import folderManager
import docManager

def split_pages(file):
	img_path = file
	name = file.parts[-1]
	pages_path = str(Path.cwd()/"tmp"/name/"pages")
	img = Image.open(img_path)
	folderManager.create_TMP(name)
	folderManager.create_PAGES_TMP(name)
	pages_left = docManager.get_field(name,'split')

	for i in range(pages_left,-1,-1):
		try:
			img.seek(i-1)
			img.save(pages_path + "/page_%s.tiff" %i, compression="raw")
			docManager.update_field(name,'split',(i-1))
		except EOFError:
			break

