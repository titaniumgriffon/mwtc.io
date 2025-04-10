+++
draft = false
date = 2025-04-10T05:59:03Z
title = 'Hugo'
authors = ["Zack Lewis"]
disableComments = true
+++

Rabbit holes are fun. Mine started like this:
Hey, an organization I am a part of wants to put on a tech conference, similar to BSides. They always have a decent CTF event going during the day. Let's build a CTF. The first thing is a scoreboard. I see some other places use CTFtime. Oh look, I have a profile already on there, so I can use that. If I'm going to build a CTF, my profile should have my website, lima3.dev. Well crap, my site that wasn't being used or updated is no longer even published. I need to update it. So let's go back to a YouTube video I saw about building a static site using Hugo and hosted on Github Pages. Following along with that I ran into issues. That's why my ADHD brain decided to spend 2 days playing with Hugo. 

I started not knowing squat about how it worked. My thought was to write stuff in markdown in Obsidian, either on desktop or mobile. Then I could drop those files into Hugo to display them. Easy enough. But not really. The first issue I ran into was that nothing was working right. As I heard someone else put it, it's a chicken and egg problem. The best way to build the site from scratch is to start with a test box, I used Ubuntu just to match the GitHub runner. Basic minimal server. Nothing special. Install Hugo from a .deb package. They don't seem to have a repo to automatically do this via apt, you have to get the link via the GitHub repo. 

```
wget -O hugo.deb https://github.com/gohugoio/hugo/releases/download/v0.145.0/hugo_extended_0.145.0_linux-amd64.deb
```

> I later found out that you can install Hugo with Snap, as well as other options:
> https://gohugo.io/installation/linux

Then install it

```dpkg -i hugo.deb```

Make sure it works 

```hugo version ```

Create a new site and init the git repo. 

```hugo new site mysite-dev
cd mysite-dev
git init
touch .empty #copy this into every empty folder so git picks it up 
git add .
git commit -m "initial commit"
```

This gets me started. After this, I had to choose a theme or build my layouts from scratch. I chose Coder from the theme library. Instead of copying the theme directly,  I discovered I could use git submodules to essentially symlink the repo into my site structure

```git submodule add https://github.com/author/hugo-theme themes/hugo-theme```

Then I follow the instructions from the theme for what to put into my hugo.toml file. This info includes the links on the homepage, my info, and what subfolder my posts are in. 

Now to test.

```hugo serve -D --bind <ip> --port 80 --baseURL "http://<ip>"```

Checking this gives me an idea if it's working. So far so good. Well, it is now. This is not how my first run thru went. I found that the serve command runs localhost as it's binding ip. It also runs on another port.  And it used localhost for the base URL, causing some themes to look for their CSS on my local machine. I was accessing the site via my desktop, not the server that's hosting it. 

Eventually, I wrote a small script to start the dev server so I didn't have to type that out so much. 

After finding out that works, I created a repo on Github and pushed everything up to it. Then I went into the GitHub Pages settings for the repo and set it to use a script for deployment. I found a script to do the deployment and put it in the .github/workflows directory.  

Now for the fun part. Content. 
Initially, I just copied my markdown files into the server, in the content folder. Then I moved them into a posts folder. Now they show up under the posts URL,  but they have a date of Jan 1, 0001. And no title. This is where my misunderstanding about how Hugo is designed comes into play. 

Hugo is designed to be completely static. Makes sense. But for some reason, I had it in my head that I could pull the Metadata from my markdown files. The date for the file could be the last modified date. Or creation date. The filename would be the title of the post. But this is not how it works. I eventually got it to use a date from the modification, but that turned out to be the date it was uploaded into github. I was not a huge fan of that but no worries. But they also show up with no title. Oops. That I can't skip over. I tried creating custom archetypes and making fields that use custom formats and all that. Nothing worked. The files never had a name. Maybe it's the theme? Tried other themes. Same thing, as well as other issues. 

After searching through so much of the documentation, I found the answer. The archetypes are only used when a new post is created from the command line. 

```hugo new posts/test.md```

This copied the archetype posts file into the new file, replacing the variables as it went. This is called Front Matter. It starts and ends with three plus symbols and includes filename and date, as well as other optional stuff. Everything after that is part of the post text. 

So I copied that data into the current posts that were already in the repo and changed the title to match the filename and the date to match the original date. Commit and see what happens. Success!

