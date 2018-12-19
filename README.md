

[![Build Status](https://travis-ci.org/superztf/lipstick-ECS.svg?branch=master)](https://travis-ci.org/superztf/lipstick-ECS)
[![npm](https://img.shields.io/npm/v/lipstick-ecs.svg)](https://www.npmjs.com/package/lipstick-ecs)
[![npm](https://img.shields.io/npm/dt/lipstick-ecs.svg)](https://www.npmjs.com/package/lipstick-ecs)
[![NpmLicense](https://img.shields.io/npm/l/lipstick-ecs.svg)](https://www.npmjs.com/package/lipstick-ecs)
[![Coverage Status](https://coveralls.io/repos/github/superztf/lipstick-ECS/badge.svg?branch=master)](https://coveralls.io/github/superztf/lipstick-ECS?branch=master)

# lipstick-ECS

## [Get example code](https://github.com/superztf/ECS-example)
This example show how to use lipstick-ECS framework.

![gif](https://raw.githubusercontent.com/superztf/ECS-example/master/example.gif)

* API description is under editing, please wait O(∩_∩)O~

<li> <a href="#function_present">present()</a>
<li> <a href="#class_EntityAdmin">Class:EntityAdmin</a>
<ul>
<li><a href="#admin_start">admin.start()</a></li>
<li><a href="#admin_stop">admin.stop()</a></li>
</ul>
<!-- <li><code>arg</code> <a class="type">&#x3C;string></a> -->
<h2>present()<span><a class="mark" href="#function_present" id="function_present">#</a></span></h2>
<li>Returns: <a class="type">&#x3C;number></a></li>
<p>This function returns a millisecond time.</p>
<p>The return is relative to an arbitrary time in the past, and not related to a date time or time stamp. Therefore not subject to clock drift. The primary use is for measuring the elapsed time.</p>
<p>If lipstick-ECS runs in browser, present() calls performance.now() actually. If in node, present() calls process.hrtime()</p>
