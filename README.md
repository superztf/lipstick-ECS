

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

* <a href="#function_present">present()</a>
* <a href="#class_EntityAdmin">Class:EntityAdmin</a>
    * <a href="#admin_start">admin.start()</a></li>
    * <a href="#admin_stop">admin.stop()</a></li>
    * <a href="#admin_SetPubComponent">admin.SetPubComponent()</a></li>
    * <a href="#admin_GetPubComponent">admin.GetPubComponent()</a></li>
    * <a href="#admin_SurePubComponent">admin.SurePubComponent()</a></li>
    * <a href="#admin_PushDeferment">admin.PushDeferment()</a></li>
    * <a href="#admin_AddSystem">admin.AddSystem()</a></li>
    * <a href="#admin_UpdateSystems">admin.UpdateSystems()</a></li>
    * <a href="#admin_CreateEntity">admin.CreateEntity()</a></li>
    * <a href="#admin_DeleteEntity">admin.DeleteEntity()</a></li>
    * <a href="#admin_GetComponentByEntity">admin.GetComponentByEntity()</a></li>
    * <a href="#admin_ValidEntity">admin.admin_ValidEntity()</a></li>
    * <a href="#admin_AssignComponents">admin.AssignComponents()</a></li>
    * <a href="#admin_RemoveComponents">admin.RemoveComponents()</a></li>
    * <a href="#admin_HasComponet">admin.HasComponet()</a></li>
    * <a href="#admin_GetComponents">admin.GetComponents()</a></li>
    * <a href="#admin_GetComponentsByTuple">admin.GetComponentsByTuple()</a></li>
* <a href="#class_Component">Class:Component</a>
    * <a href="#component_entity">component.entity</a></li>
    * <a href="#component_GetSibling">component.GetSibling()</a></li>
    * <a href="#component_SureSibling">component.SureSibling()</a></li>
    * <a href="#component_AddSibling">component.AddSibling()</a></li>
    * <a href="#component_RemoveSibling">component.RemoveSibling()</a></li>
* <a href="#class_System">Class:System</a>
    * <a href="#system_priority">system.priority</a></li>
    * <a href="#system_Update">system.Update()</a></li>
    


<!-- <li><code>arg</code> <a class="type">&#x3C;string></a> -->
<h2>present()<span><a class="mark" href="#function_present" id="function_present">#</a></span></h2>
<li>Returns: <a class="type">&#x3C;number></a></li>
<p>This function returns a millisecond time.</p>
<p>The return is relative to an arbitrary time in the past, and not related to a date time or time stamp. Therefore not subject to clock drift. The primary use is for measuring the elapsed time.</p>
<p>If lipstick-ECS runs in browser, present() calls performance.now() actually. If in node, present() calls process.hrtime()</p>
