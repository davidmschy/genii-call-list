from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

# get version from __version__ variable in genii_call_list/__init__.py
from genii_call_list import __version__ as version

setup(
    name="genii_call_list",
    version=version,
    description="A branded, mobile-first daily lead dashboard for salespeople in ERPNext",
    author="Genii",
    author_email="david@geniinow.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires
)
