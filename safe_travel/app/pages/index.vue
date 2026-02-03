<script lang="ts" setup>
const activeName = ref("first");
</script>

<template>
  <div class="safe_box" :class="{ mobile: $device.isMobileOrTablet }">
    <h1 class="home_title">文明珠海安全出行</h1>
    <el-container v-if="$device.isDesktop">
      <el-aside class="safe_box_aside" width="400px">
        <el-tabs v-model="activeName" class="demo-tabs">
          <el-tab-pane label="公告" name="first"
            ><Announcement></Announcement>
          </el-tab-pane>
          <el-tab-pane label="使用说明" name="second">
            <HomeAbout></HomeAbout>
          </el-tab-pane> </el-tabs
      ></el-aside>
      <el-main style="display: flex">
        <HomeMap></HomeMap>
      </el-main>
    </el-container>
    <template v-else>
      <el-tabs v-model="activeName">
        <el-tab-pane label="地图" name="first">
          <HomeMap></HomeMap
        ></el-tab-pane>
        <el-tab-pane label="公告" name="second"
          ><Announcement></Announcement>
        </el-tab-pane>
        <el-tab-pane label="使用说明" name="third">
          <HomeAbout></HomeAbout>
        </el-tab-pane>
      </el-tabs>
    </template>
  </div>
</template>

<style scoped>
.safe_box {
  padding: 20px 0 0 20px;
  min-height: calc(100vh - 10px);
  display: flex;
  flex-direction: column;
}

.safe_box.mobile {
  padding: 20px;
}

.home_title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 23px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.9);
  z-index: 2; /* 保证在地图之上 */
}

.safe_box_aside {
  border-right: 1px solid #e4e7ed;
  padding-right: 20px;
}
</style>
