from pathlib import Path 
import os


# Folder Manager
# Add and remove folders


def create_TMP(name):

	current = Path.cwd()
	folder = current/"tmp"/name 
	if not Path(folder).exists():
		Path(folder).mkdir()


def create_PAGES_TMP(name):

	current = Path.cwd()
	folder = current/"tmp"/name/"pages"
	if not Path(folder).exists():
		Path(folder).mkdir()


def create_REG_TMP(name):

	current = Path.cwd()
	folder = current/"tmp"/name/"regions"
	if not Path(folder).exists():
		Path(folder).mkdir()


def create_RESULT(name): 

	previous = Path.cwd().parents[0]
	folder = previous/"results"/name
	if not Path(folder).exists():
		Path(folder).mkdir()


def create_CORRECTION(name): 

	current = Path.cwd()
	folder = current/"tmp"/name/"correction"
	if not Path(folder).exists():
		Path(folder).mkdir()


def delete_TMP(name):

	current = Path.cwd()
	folder = current/"tmp"/name
	for f in folder.glob(".JSON"):
		f.unlink()
	folder.rmdir()


def delete_REG_TMP(name):

	current = Path.cwd()
	folder = current/"tmp"/name/"regions"
	for f in folder.glob("*.JSON"):
		f.unlink()
	folder.rmdir()

def delete_IMG_TMP(name):

	current = Path.cwd()
	folder = current/"tmp"/name/"pages"
	for f in folder.glob("*.tiff"):
		f.unlink()

	for h in folder.glob("*.hocr"):
		h.unlink()
	
	folder.rmdir()


