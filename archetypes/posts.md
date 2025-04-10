+++ 
draft = true
date = {{ .File.Modtime | .Date }}
#title: '{{ .File.BaseFileName | humanize | title }}'
title: "{{ .File }}"
description = ""
slug: "{{ .File.BaseFileName | urlize }}"
url: "/posts/{{ .File.BaseFileName | urlize }}/"
authors = []
tags = []
categories = []
externalLink = ""
series = []
comments: false
+++
