#!/usr/bin/env python3
import split
import docManager
import preprocess
import regions
import ocr
import compare
import merge
import sys
from pathlib import Path
import click
import tesserocr

def to_do(file,lang,tmp,prep,comp):
	n = file['name']
	status = file['status']
	path = file['path']

	if (status['split']):
		print("Splitting %s"%n)
		split.split_pages(Path(path))
		print("%s splitted"%n)

	if (status['preprocess']):
		print("Preprocessing %s"%n)
		preprocess.pre_process(n,lang,prep)
		print("%s preprocessed"%n)

	if (status['segment']):
		print("Segmenting %s"%n)
		regions.save(n,lang,tmp)
		print("%s segmented"%n)

	if (status['ocr'] and comp):
		print("OCR %s"%n)
		ocr.ocr(n,lang)
		print("%s OCR done"%n)

	if (status['compare'] and comp):
		print("Comparing results of %s"%n)
		compare.modify(n,tmp)
		docManager.update_field(n,'compare',0)
		print("%s results compared"%n)

	if (status['merge']):
		print("Merging %s"%n)
		merge.merge(n,tmp)
		docManager.update_field(n,'merge',0)
		print("%s merged"%n)


	docManager.delete_data(n)



@click.command()
@click.argument('file')
#@click.option('--dictionary',type=click.Choice(['eng_old', 'por_lisboa'], case_sensitive=False),help="Select customized dictionaries", multiple=True)
#@click.option('--correction', is_flag=True ,help="Show candidates for manual correction.")
@click.option('--comp',is_flag=True,help="Disable line segmentation comparison", default=True,show_default=True)
@click.option('--prep',is_flag=True,help="Additional prep-processing", default=False,show_default=True)
@click.option('--lang',type=click.Choice(tesserocr.get_languages(str(Path.cwd().parents[0]/'tessdata'))[1], case_sensitive=False), multiple=True, show_default=True, default=('eng',),help="Available languages.")
@click.option('--tmp', is_flag=True ,help="Keep tmp files. WARNING: It requires more free disk space", default=False, show_default=True)
@click.option('--folder', is_flag=True ,help="Workflow is performed in all images from this folder", default=False, show_default=True)


def main(file,lang,tmp,folder,prep,comp):

	if (folder):
		path = Path(file)
		for image in path.glob("*.tif"):
			image.rename(image.with_suffix(".tiff"))

		for image in path.glob("*.tiff"):
			inputFile = Path(image)
			docManager.write_name(inputFile)
			doc = docManager.get_data(inputFile.parts[-1])
			to_do(doc,lang,tmp,prep,comp)
			print("Done")

	else:
		inputFile = Path(file)
		docManager.write_name(inputFile)
		doc = docManager.get_data(inputFile.parts[-1])
		to_do(doc,lang,tmp,prep,comp)
		print("Done")


if __name__ == "__main__":
	main()
