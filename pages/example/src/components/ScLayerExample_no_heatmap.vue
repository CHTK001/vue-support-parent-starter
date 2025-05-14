
<template>
  <div class="sc-layer-example">
    <h2>ScLayer 鍦板浘缁勪欢绀轰緥</h2>

    <div class="example-content">
      <!-- 宸︿晶鍦板浘鍖哄煙 -->
      <div class="map-area">
        <ScLayer ref="layerRef" :height="config.height" :map-type="config.mapType" :map-tile="config.mapTil
e"
          :center="config.center" :zoom="config.zoom" :dragging="config.dragging"
          :scroll-wheel-zoom="config.scrollWheelZoom" :map-key="config.mapKey"
          :show-toolbar="config.showToolbar" :show-scale-line="config.showScaleLine" :map="config.map"
           @map-initialized="onMapInit"
          @map-click="onMapClick" @marker-click="onMarkerClick" @toolbar-state-change="onToolbarStateChange
"
          @marker-create="onMarkerCreate" @marker-update="onMarkerUpdate" @marker-delete="onMarkerDelete"
          @shape-create="onShapeCreate" @shape-update="onShapeUpdate" @shape-delete="onShapeDelete">
        </ScLayer>
      </div>

      <!-- 鍙充晶閰嶇疆鍖哄煙 -->
      <div class="config-area thin-scrollbar">
        <div class="config-section">
          <div class="config-item"></div>
            <div class="label">鍦板浘閰嶇疆</div>
            <div class="controls">
              <!-- 鏇挎崲鍦板浘绫诲瀷涓嬫媺妗嗕负鎸夐挳缁?-->
              <div class="control-row">
                <span>鍦板浘绫诲瀷:</span>
                <div class="button-group">
                  <button @click="changeMapType(MapType.GAODE)"
                    :class="{ 'active-button': config.mapType === MapType.GAODE }">
                    楂樺痉鍦板浘
                  </button>
                  <button @click="changeMapType(MapType.OSM)"
                    :class="{ 'active-button': config.mapType === MapType.OSM }">
                    OpenStreetMap
                  </button>
                  <button @click="changeMapType(MapType.TIANDI)"
                    :class="{ 'active-button': config.mapType === MapType.TIANDI }">
                    澶╁湴鍥?                  </button>
                </div>
              </div>
              <div class="control-row">
                <span>鍥惧眰绫诲瀷:</span>
                <div class="button-group">
                  <button @click="changeLayerType('normal')" :class="{ 'active-button': tileType === 'norma
l' }">
                    鏍囧噯鍥惧眰
                  </button>
                  <button @click="changeLayerType('satellite')" :class="{ 'active-button': tileType === 'sa
tellite' }">
                    鍗槦鍥惧眰
                  </button>
                  <button @click="changeLayerType('hybrid')" :class="{ 'active-button': tileType === 'hybri
d' }">
                    娣峰悎鍥惧眰
                  </button>
                </div>
              </div>
              <div class="control-row">
                <span>宸ュ叿鏍忎綅缃?</span>
                <div class="button-group">
                  <button @click="changeToolbarPosition(ToolbarPosition.TOP_LEFT)"
                    :class="{ 'active-button': toolbarPosition === ToolbarPosition.TOP_LEFT }">
                    宸︿笂瑙?                  </button>
                  <button @click="changeToolbarPosition(ToolbarPosition.TOP_RIGHT)"
                    :class="{ 'active-button': toolbarPosition === ToolbarPosition.TOP_RIGHT }">
                    鍙充笂瑙?                  </button>
                </div>
              </div>
              <div class="control-row toolbar-position-row">
                <div class="button-group">
                  <button @click="changeToolbarPosition(ToolbarPosition.BOTTOM_LEFT)"
                    :class="{ 'active-button': toolbarPosition === ToolbarPosition.BOTTOM_LEFT }">
                    宸︿笅瑙?                  </button>
                  <button @click="changeToolbarPosition(ToolbarPosition.BOTTOM_RIGHT)"
                    :class="{ 'active-button': toolbarPosition === ToolbarPosition.BOTTOM_RIGHT }">
                    鍙充笅瑙?                  </button>
                </div>
              </div>
              
              <!-- 娣诲姞宸ュ叿鏍忔柟鍚戞帶鍒?-->
              <div class="control-row">
                <span>宸ュ叿鏍忔柟鍚?</span>
                <div class="button-group">
                  <button @click="changeToolbarDirection(ToolbarDirection.HORIZONTAL)"
                    :class="{ 'active-button': toolbarDirection === ToolbarDirection.HORIZONTAL }">
                    姘村钩鏂瑰悜
                  </button>
                  <button @click="changeToolbarDirection(ToolbarDirection.VERTICAL)"
                    :class="{ 'active-button': toolbarDirection === ToolbarDirection.VERTICAL }">
                    鍨傜洿鏂瑰悜
                  </button>
                </div>
              </div>
              
              <div class="control-row">
                <span>鍙嫋鍔?</span>
                <input type="checkbox" v-model="config.dragging" @change="handleInteractionChange">
              </div>
              <div class="control-row">
                <span>婊氳疆缂╂斁:</span>
                <input type="checkbox" v-model="config.scrollWheelZoom" @change="handleInteractionChange">
              </div>
              <div class="control-row">
                <span>姣斾緥灏?</span>
                <input type="checkbox" v-model="config.showScaleLine" @change="handleScaleLineChange">
              </div>
              <div class="control-row">
                <span>缂╂斁绾у埆:</span>
                <input type="range" v-model.number="config.zoom" min="3" max="18" @change="handleZoomChange
">
                <span class="value">{{ config.zoom }}</span>
              </div>
              <div class="control-row">
                <span>蹇€熷垏鎹?</span>
              </div>
              <div class="control-row buttons-row">
                <button @click="switchToLayer(MapType.GAODE, MapTile.NORMAL)"
                  :class="{ 'active-button': config.mapType === MapType.GAODE && config.mapTile === MapTile
.NORMAL }">
                  楂樺痉鏍囧噯
                </button>
                <button @click="switchToLayer(MapType.GAODE, MapTile.SATELLITE)"
                  :class="{ 'active-button': config.mapType === MapType.GAODE && config.mapTile === MapTile
.SATELLITE }">
                  楂樺痉鍗槦
                </button>
              </div>
              <div class="control-row buttons-row">
                <button @click="switchToLayer(MapType.OSM, MapTile.NORMAL)"
                  :class="{ 'active-button': config.mapType === MapType.OSM && config.mapTile === MapTile.N
ORMAL }">
                  OSM鍦板浘
                </button>
                <button @click="switchToLayer(MapType.TIANDI, MapTile.NORMAL)"
                  :class="{ 'active-button': config.mapType === MapType.TIANDI && config.mapTile === MapTil
e.NORMAL }">
                  澶╁湴鍥?                </button>
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">鏍囪鐐规搷浣?/div>
            <div class="controls">
              <!-- 鏍囪鐐规搷浣滃尯鍩?- 娣诲姞鍔熻兘鍒嗙粍 -->
              <div class="feature-group-title">鍩烘湰鏍囪</div>
              <div class="control-row buttons-row">
                <button @click="addRandomMarkers(3)">娣诲姞闅忔満鏍囪</button>
                <button @click="clearAllMarkers">娓呴櫎鎵€鏈夋爣璁?/button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addRandomMarkers(10)">娣诲姞10涓殢鏈虹偣</button>
              </div>

              <div class="feature-group-title">鐗规畩鏍囪</div>
              <div class="control-row buttons-row">
                <button @click="addColoredMarkers">娣诲姞鍥炬爣绫诲瀷绀轰緥</button>
                <button @click="addClusterMarkers">娣诲姞鑱氬悎鏍囪</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="toggleAllMarkers">{{ allMarkersVisible ? '闅愯棌鎵€鏈夋爣璁扮偣' : '鏄剧ず鎵€鏈夋爣璁扮偣' }}</
button>
                <button @click="toggleAllLabels">{{ allLabelsVisible ? '闅愯棌鎵€鏈夋爣绛? : '鏄剧ず鎵€鏈夋爣绛? }}</button
>
              </div>

              <div class="feature-group-title">Popover鏍囪</div>
              <div class="control-row buttons-row">
                <button @click="addPopoverMarker">娣诲姞榛樿鏄剧ずPopover鏍囪</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addTemplateMarker">娣诲姞甯︽ā鏉跨殑鏍囪鐐?/button>
                <button @click="addNoTemplateMarker">娣诲姞鏃犳ā鏉跨殑鏍囪鐐?/button>
              </div>

              <div class="feature-group-title">鍒嗙粍鏍囪</div>
              <div class="control-row buttons-row">
                <button @click="addGroupedMarkers">娣诲姞鍒嗙粍鏍囪鐐?/button>
                <button @click="toggleGroupVisibility">鍒囨崲鍒嗙粍鏄剧ず</button>
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">鍥惧舰鎿嶄綔</div>
            <div class="controls">
              <!-- 鍥惧舰鎿嶄綔鍖哄煙 - 娣诲姞鍔熻兘鍒嗙粍 -->
              <div class="feature-group-title">鍩烘湰鍥惧舰</div>
              <div class="control-row buttons-row">
                <button @click="addSquareShape">娣诲姞姝ｆ柟褰?/button>
                <button @click="addCircleShape">娣诲姞鍦嗗舰</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addRectangleShape">娣诲姞鐭╁舰</button>
                <button @click="addPolygonShape">娣诲姞澶氳竟褰?/button>
              </div>

              <div class="feature-group-title">绾挎鍜岀偣</div>
              <div class="control-row buttons-row">
                <button @click="addLineShape">娣诲姞绾挎</button>
                <button @click="addPointShape">娣诲姞鐐?/button>
              </div>

              <div class="feature-group-title">澶嶅悎鍜岀鐞?/div>
              <div class="control-row buttons-row">
                <button @click="addCustomShapeExample">娣诲姞澶嶅悎鍥惧舰绀轰緥</button>
                <button @click="clearAllShapes">娓呴櫎鎵€鏈夊浘褰?/button>
              </div>
              <div class="control-row buttons-row">
                <button @click="toggleShapeVisible">{{ allShapesVisible ? '闅愯棌鎵€鏈夊浘褰? : '鏄剧ず鎵€鏈夊浘褰? }}</but
ton>
                <button @click="modifyRandomShape">淇敼闅忔満鍥惧舰</button>
              </div>
              
              <div class="feature-group-title">杈圭晫缁樺埗</div>
              <div class="control-row buttons-row">
                <button @click="drawTaizhouBoundary">缁樺埗鍙板窞杈圭晫</button>
              </div>
            </div>
          </div>

          <!-- 娣诲姞杞ㄨ抗鎿嶄綔閮ㄥ垎 -->
          <div class="config-item">
            <div class="label">杞ㄨ抗鎿嶄綔</div>
            <div class="controls">
              <!-- 杞ㄨ抗鎿嶄綔鍖哄煙 - 娣诲姞鍔熻兘鍒嗙粍 -->
              <div class="feature-group-title">杞ㄨ抗绀轰緥</div>
              <div class="control-row buttons-row">
                <button @click="addSampleTrack">娣诲姞绀轰緥杞ㄨ抗</button>
                <button @click="addComplexTrack">娣诲姞澶嶆潅杞ㄨ抗</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addCircularTrack">娣诲姞鐜舰杞ㄨ抗</button>
                <button @click="addZigzagTrack">娣诲姞Z瀛楀瀷杞ㄨ抗</button>
              </div>

              <div class="feature-group-title">杞ㄨ抗鎺у埗</div>
              <div class="control-row buttons-row">
                <button @click="playTrack">鎾斁杞ㄨ抗</button>
                <button @click="stopTrack">鍋滄杞ㄨ抗</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="clearAllTracks">娓呴櫎鎵€鏈夎建杩?/button>
                <button @click="toggleTrackVisible">{{ allTracksVisible ? '闅愯棌鎵€鏈夎建杩? : '鏄剧ず鎵€鏈夎建杩? }}</but
ton>
              </div>

              <!-- 鍦ㄨ建杩规搷浣滃尯鍩熸坊鍔犺建杩规挱鏀鹃厤缃€夐」 -->
              <div class="feature-group-title">杞ㄨ抗鎾斁閰嶇疆</div>
              <div class="control-row">
                <span>閫熷害:</span>
                <input type="range" v-model.number="trackPlaySpeed" min="10" max="200" step="10" @change="u
pdateTrackPlayConfig">
                <span class="value">{{ trackPlaySpeed }} km/h</span>
              </div>
              <div class="control-row">
                <span>寰幆鎾斁:</span>
                <input type="checkbox" v-model="trackPlayLoop" @change="updateTrackPlayConfig">
              </div>
              <div class="control-row">
                <span>璺熼殢鐩告満:</span>
                <input type="checkbox" v-model="trackPlayWithCamera" @change="updateTrackPlayConfig">
              </div>
              <div class="control-row">
                <span>鏄剧ず鑺傜偣:</span>
                <input type="checkbox" v-model="trackPlayShowNodes" @change="updateTrackPlayConfig">
              </div>

              <!-- 鍦ㄨ建杩规搷浣滃尯鍩熺殑杞ㄨ抗鍒楄〃閮ㄥ垎娣诲姞 -->
              <div class="feature-group-title">杞ㄨ抗鍒楄〃</div>
              <div class="track-list">
                <div v-if="tracks.length === 0" class="no-tracks">鏆傛棤杞ㄨ抗</div>
                <div v-else>
                  <div 
                    v-for="track in tracks" 
                    :key="track.id" 
                    class="track-item" 
                    :class="{ 'active': track.id === activeTrackId }"
                    @click="selectTrack(track.id)"
                    @dblclick="locateTrack(track.id)"
                  >
                    <div class="track-item-header">
                      <span class="track-name">{{ track.name }}</span>
                      <span class="track-points-count">{{ track.points.length }}涓偣</span>
                    </div>
                    <div class="track-item-actions">
                      <button @click.stop="playTrackById(track.id)">鎾斁</button>
                      <button @click.stop="stopTrackById(track.id)">鍋滄</button>
                      <button @click.stop="removeTrackById(track.id)">鍒犻櫎</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 娣诲姞鐑姏鍥炬搷浣滈儴鍒?-->
          <div class="config-item">
            <div class="label">鐑姏鍥炬搷浣?/div>
            <div class="controls">
              <!-- 鐑姏鍥炬搷浣滃尯鍩?- 娣诲姞鍔熻兘鍒嗙粍 -->
              <div class="feature-group-title">鐑姏鍥炬帶鍒?/div>
              <div class="control-row buttons-row">
              </div>
              <div class="control-row buttons-row">
                <button @click="toggleHeatmapPerformanceMode">{{ heatmapPerformanceMode ? '绂佺敤鎬ц兘妯″紡' : '鍚
敤鎬ц兘妯″紡' }}</button>
              </div>

              <div class="feature-group-title">鐑姏鐐圭鐞?/div>
              <div class="control-row buttons-row">
                <button @click="addClusteredHeatmapPoints">娣诲姞鑱氱被鐑姏鐐?/button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addWeightedHeatmapPoints">娣诲姞鏉冮噸鐑姏鐐?/button>
                <button @click="clearHeatmap">娓呴櫎鐑姏鍥?/button>
              </div>
              <div class="control-row buttons-row">
                <button @click="togglePointsVisible">{{ pointsVisible ? '闅愯棌鏁版嵁鐐? : '鏄剧ず鏁版嵁鐐? }}</button>
              </div>
            </div>
          </div>

          <!-- 娣诲姞椋炵嚎鍥炬搷浣滈儴鍒?-->
          <div class="config-item">
            <div class="label">椋炵嚎鍥炬搷浣?/div>
            <div class="controls">
              <!-- 椋炵嚎鍥炬搷浣滃尯鍩?- 娣诲姞鍔熻兘鍒嗙粍 -->
              <div class="feature-group-title">椋炵嚎鎺у埗</div>
              <div class="control-row buttons-row">
                <button @click="enableFlightLine">鍚敤椋炵嚎鍥?/button>
                <button @click="disableFlightLine">绂佺敤椋炵嚎鍥?/button>
                <button @click="showAllFlightLines">鏄剧ず鍏ㄩ儴椋炵嚎</button>
              </div>

              <div class="feature-group-title">椋炵嚎鏍峰紡</div>
              <div class="control-row buttons-row">
                <button @click="addRandomFlightLines">娣诲姞闅忔満椋炵嚎</button>
                <button @click="addChainFlightLines">娣诲姞閾剧姸椋炵嚎</button>
              </div>
              <div class="control-row buttons-row">
                <button @click="addStarFlightLines">娣诲姞鏄熷瀷椋炵嚎</button>
                <button @click="clearFlightLines">娓呴櫎椋炵嚎</button>
              </div>
              <div class="control-row">
                <span>鏇茬巼:</span>
                <input type="range" v-model.number="flightLineConfig.curveness" min="0" max="1" step="0.1"
                  @change="updateFlightLineConfig">
                <span class="value">{{ flightLineConfig.curveness?.toFixed(1) || '0.0' }}</span>
              </div>
              <div class="control-row">
                <span>鍔ㄧ敾:</span>
                <input type="checkbox" v-model="flightLineConfig.showEffect" @change="updateFlightLineConfi
g">
              </div>
              <div class="control-row">
                <span>绾垮:</span>
                <input type="range" v-model.number="flightLineConfig.width" min="1" max="10"
                  @change="updateFlightLineConfig">
                <span class="value">{{ flightLineConfig.width }}</span>
              </div>
              <div class="control-row">
                <span>鑺傜偣鏄剧ず:</span>
                <input type="checkbox" v-model="flightLineConfig.showNodes" @change="updateFlightLineConfig
">
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">鏍囪鐐瑰垪琛?/div>
            <div class="marker-stats">
              <span>鎬绘暟: {{ markers.length }}</span>
              <span>鍙: {{ visibleMarkerCount }}</span>
            </div>
            <div class="marker-list">
              <div v-if="markers.length === 0" class="no-markers">
                鏆傛棤鏍囪鐐?              </div>
              <div v-for="marker in markers.slice(0, 5)" :key="marker.id" class="marker-item thin-scrollbar
">
                <div class="marker-header">
                  <span class="marker-id">ID: {{ safeSlice(marker.id) }}</span>
                  <span :class="['marker-status', marker.visible ? 'visible' : 'hidden']">
                    {{ marker.visible ? '鍙' : '闅愯棌' }}
                  </span>
                </div>
                <div class="marker-position">浣嶇疆: [{{ marker.position[0].toFixed(4) }}, {{ marker.position[
1].toFixed(4)
                  }}]</div>
                <div class="marker-title" v-if="marker.title">鏍囬: {{ marker.title }}</div>
                <div class="marker-actions">
                  <button @click="toggleMarkerVisibility(marker)">
                    {{ marker.visible ? '闅愯棌' : '鏄剧ず' }}
                  </button>
                  <button @click="toggleMarkerPopover(marker)">
                    {{ marker.showPopover ? '闅愯棌Popover' : '鏄剧ずPopover' }}
                  </button>
                  <button @click="moveMarker(marker)">绉诲姩</button>
                  <button @click="removeMarker(marker)">鍒犻櫎</button>
                </div>
              </div>
              <div v-if="markers.length > 5" class="more-markers">
                杩樻湁 {{ markers.length - 5 }} 涓爣璁扮偣鏈樉绀?..
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">鍥惧舰鍒楄〃</div>
            <div class="shape-stats">
              <span>鎬绘暟: {{ shapes.length }}</span>
              <span>鍙: {{ allShapesVisible ? shapes.length : 0 }}</span>
            </div>
            <div class="shape-list">
              <div v-if="shapes.length === 0" class="no-shapes">
                鏆傛棤鍥惧舰
              </div>
              <div v-for="shape in shapes.slice(0, 5)" :key="shape.id" class="shape-item thin-scrollbar">
                <div class="shape-header">
                  <span class="shape-id">ID: {{ safeSlice(shape.id) }}</span>
                  <span class="shape-type">绫诲瀷: {{ getShapeTypeName(shape.type) }}</span>
                </div>
                <div class="shape-data" v-if="shape.data">
                  <template v-if="typeof shape.data === 'object'">
                    <div v-for="(value, key) in shape.data" :key="key" class="shape-data-item">
                      {{ key }}: {{ value }}
                    </div>
                  </template>
                  <template v-else>
                    鏁版嵁: {{ shape.data }}
                  </template>
                </div>
                <div class="shape-status">
                  鐘舵€? <span :class="[shape.visible === false ? 'hidden' : 'visible']">
                    {{ shape.visible === false ? '闅愯棌' : '鍙' }}
                  </span>
                </div>
                <div class="shape-actions">
                  <button @click="toggleShapeVisibility(shape)">
                    {{ shape.visible === false ? '鏄剧ず' : '闅愯棌' }}
                  </button>
                  <button @click="changeShapeStyle(shape)">
                    淇敼鏍峰紡
                  </button>
                  <button @click="removeShape(shape)">
                    鍒犻櫎
                  </button>
                </div>
              </div>
              <div v-if="shapes.length > 5" class="more-shapes">
                杩樻湁 {{ shapes.length - 5 }} 涓浘褰㈡湭鏄剧ず...
              </div>
            </div>
          </div>

          <!-- 椋炵嚎鍥惧垪琛?-->
          <div class="config-item">
            <div class="label">椋炵嚎鍥惧垪琛?/div>
            <div class="flight-line-stats">
              <span>鎬绘暟: {{ flightLines.length }}</span>
              <span>宸查€夋嫨: {{ selectedFlightLine ? 1 : 0 }}</span>
            </div>
            <div class="flight-line-list">
              <div v-if="flightLines.length === 0" class="no-flight-lines">
                鏆傛棤椋炵嚎鏁版嵁
              </div>
              <div v-for="line in flightLines" :key="line.id" class="flight-line-item thin-scrollbar"
                :class="{'flight-line-selected': selectedFlightLine === line.id}" 
                @click="selectFlightLine(line.id)">
                <div class="flight-line-header">
                  <span class="flight-line-id">ID: {{ safeSlice(line.id) }}</span>
                  <span class="flight-line-value" v-if="line.value">鍊? {{ line.value }}</span>
                </div>
                <div class="flight-line-route">
                  <span>{{ line.fromName }}</span>
                  <span class="flight-line-arrow">鈫?/span>
                  <span>{{ line.toName }}</span>
                </div>
              </div>
              <div v-if="flightLines.length > 10" class="more-flight-lines">
                杩樻湁 {{ flightLines.length - 10 }} 鏉￠绾挎湭鏄剧ず...
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">浜嬩欢鏃ュ織</div>
            <div class="log-container">
              <div v-for="(log, index) in logs" :key="index" class="log-item thin-scrollbar">
                <span class="log-time">{{ log.time }}</span>
                <span class="log-type">{{ log.type }}:</span>
                <span class="log-message">{{ log.message }}</span>
              </div>
              <div v-if="logs.length === 0" class="no-logs">
                鏆傛棤浜嬩欢璁板綍
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">鏍囪鐐瑰垎缁?/div>
            <div class="controls">
              <div class="marker-group-stats">
                <span>鍒嗙粍鎬绘暟: {{ markerGroups.length }}</span>
              </div>
              <div class="marker-group-list">
                <div v-if="markerGroups.length === 0" class="no-marker-groups">
                  鏆傛棤鏍囪鐐瑰垎缁?                </div>
                <div v-for="group in markerGroups" :key="group.name" class="marker-group-item thin-scrollba
r">
                  <div class="marker-group-header">
                    <span class="marker-group-name">{{ group.name }}</span>
                    <span :class="['marker-group-status', group.visible ? 'visible' : 'hidden']">
                      {{ group.visible ? '鍙' : '闅愯棌' }}
                    </span>
                  </div>
                  <div class="marker-group-count">鏍囪鐐规暟閲? {{ getGroupMarkerCount(group.name) }}</div>
                  <div class="marker-group-actions">
                    <button @click="toggleMarkerGroupVisibility(group.name)">
                      {{ group.visible ? '闅愯棌' : '鏄剧ず' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 娣诲姞鐑姏鍥剧偣鍒楄〃 -->
          <div class="config-item">
            <div class="label">鐑姏鍥剧偣鍒楄〃</div>
            <div class="controls">
              <div class="heatmap-stats">
                <span>鎬绘暟: {{ heatmapPoints.length }}</span>
                <span>宸查€夋嫨: {{ selectedHeatmapPoint ? 1 : 0 }}</span>
              </div>
              <div class="heatmap-list">
                <div v-if="heatmapPoints.length === 0" class="no-heatmap-points">
                  鏆傛棤鐑姏鍥剧偣鏁版嵁
                </div>
                <div v-for="point in heatmapPoints" :key="point.id" class="heatmap-item thin-scrollbar"
                  :class="{'heatmap-selected': selectedHeatmapPoint === point.id}" 
                  <div class="heatmap-header">
                    <span class="heatmap-name">{{ point.name || '鏈懡鍚嶇偣' }}</span>
                    <span class="heatmap-weight">鏉冮噸: {{ point.weight?.toFixed(2) || '0.00' }}</span>
                  </div>
                  <div class="heatmap-position">
                    鍧愭爣: [{{ point.longitude?.toFixed(4) || '0.0000' }}, {{ point.latitude?.toFixed(4) || '
0.0000' }}]
                  </div>
                </div>
                <div v-if="heatmapPoints.length > 10" class="more-heatmap-points">
                  杩樻湁 {{ heatmapPoints.length - 10 }} 涓儹鍔涚偣鏈樉绀?..
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "ScLayerExample"
};
</script>

<script setup lang="ts">
import ScLayer from '@repo/components/ScLayer/index.vue';
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { MapType, MapTile } from '@repo/components/ScLayer/types/index';
import { DEFAULT_MAP_CONFIG } from '@repo/components/ScLayer/types';
import type { ShapeOption, Track, TrackPlayer } from '@repo/components/ScLayer';
import type { HeatmapPoint, HeatmapConfig } from '@repo/components/ScLayer/types/heatmap';
import { ToolbarPosition, ToolbarDirection } from '@repo/components/ScLayer/types/toolbar';
// 寮曞叆椋炵嚎鍥剧被鍨嬪畾涔?import type { FlightLinePoint, FlightLineConfig, FlightLineData } from '@repo/components/S
cLayer/types/flightline';
// 寮曞叆Element Plus缁勪欢
import { ElMessage } from 'element-plus';

// 鍦板浘瀹炰緥寮曠敤
const layerRef = ref(null);

// 鐑姏鍥剧浉鍏?const heatmapPoints = ref<Array<HeatmapPoint>>([]);
const pointsVisible = ref(false);
// 娣诲姞褰撳墠閫変腑鐨勭儹鍔涘浘璁板綍
const selectedHeatmapPoint = ref<string | null>(null);
// 鐑姏鍥炬€ц兘妯″紡
const heatmapPerformanceMode = ref(false);

// 椋炵嚎鍥剧浉鍏?const flightLinePoints = ref<Array<FlightLinePoint>>([]);
const flightLineConfig = ref<FlightLineConfig>({
  curveness: 0.2,        // 鏇插害璋冩暣涓?.2锛屼笌sakitam绀轰緥涓€鑷?  width: 1,              // 绾垮璋冩暣涓?
  showEffect: true,      // 鏄剧ず鏁堟灉
  showNodes: true,       // 鏄剧ず鑺傜偣
  color: '#a6c84c',      // 浣跨敤sakitam绀轰緥涓殑棰滆壊
  opacity: 0.5,          // 閫忔槑搴﹁皟鏁翠负0.5
  effectPeriod: 6,       // 鏁堟灉鍛ㄦ湡璋冩暣涓?
  effectTrailLength: 0, // 鏁堟灉杞ㄨ抗闀垮害璋冩暣涓?.7
  effectSymbolSize: 18,   // 鍔ㄧ敾鏁堟灉澶у皬璁句负8
  nodeSymbolSize: 3,     // 鑺傜偣澶у皬浠?鍑忓皬鍒?
  effectSymbol: 'plane', // 鏁堟灉绗﹀彿鏀逛负arrow
  visible: true,         // 鍙鎬?  nodeColor: '#ddb926',  // 鑺傜偣棰滆壊
  nodeEffect: true,      // 鑺傜偣鏁堟灉
  zIndex: 90,            // 灞傜骇
  hideOnMoving: false,   // 绉诲姩鏃朵笉闅愯棌
  hideOnZooming: false,  // 缂╂斁鏃朵笉闅愯棌
  enablePerformanceMode: false // 鍏抽棴鎬ц兘妯″紡浠ョ‘淇濇樉绀?});

// 椋炵嚎鍥剧浉鍏崇姸鎬?const flightLineActive = ref(false);

// 椋炵嚎鍥惧垪琛ㄦ暟鎹?- 淇敼涓哄崟閫夋ā寮?const flightLines = ref<Array<FlightLineData & { id: string }>>([]);
const selectedFlightLine = ref<string | null>(null);

// 鍒涘缓涓€涓猄hape鏋氫妇甯搁噺
const ShapeType = {
  POINT: 'Point',
  LINE: 'LineString',
  POLYGON: 'Polygon',
  CIRCLE: 'Circle',
  RECTANGLE: 'Rectangle',
  SQUARE: 'Square'
};

// 鍥惧眰绫诲瀷閫夋嫨锛圲I灞曠ず鐢級
const tileType = ref('normal');

// 鍦板浘閰嶇疆
const config = reactive({
  height: 600,
  mapType: MapType.GAODE,
  mapTile: MapTile.NORMAL,
  map: DEFAULT_MAP_CONFIG,
  center: [39.909186, 116.397411] as [number, number],
  zoom: 10,
  dragging: true,
  scrollWheelZoom: true,
  showToolbar: true,
  showScaleLine: true,
  mapKey: {}
});

// 鏍囪鐐规暟鎹?const markers = ref<any[]>([]);
const allMarkersVisible = ref(true);
const allLabelsVisible = ref(true);

// 鏍囪鐐瑰垎缁勬暟鎹?const markerGroups = ref<{ name: string, visible: boolean }[]>([]);
// 褰撳墠閫変腑鐨勭敤浜庡垏鎹㈡樉绀虹殑鍒嗙粍绱㈠紩
const currentGroupIndex = ref(0);

// 鍥惧舰鏁版嵁
const shapes = ref<ShapeOption[]>([]);
const allShapesVisible = ref(true);

// 杞ㄨ抗鐩稿叧鐘舵€?const tracks = ref<{ id: string; name: string; points: any[]; visible: boolean }[]>([]);
const allTracksVisible = ref(true);
const hasTrack = ref(false);
const activeTrackId = ref<string | null>(null); // 褰撳墠閫変腑鐨勮建杩笽D

// 杞ㄨ抗鎾斁閰嶇疆
const trackPlaySpeed = ref(60);
const trackPlayLoop = ref(true);
const trackPlayWithCamera = ref(false);
const trackPlayShowNodes = ref(false);

// 鏇存柊杞ㄨ抗鎾斁閰嶇疆
const updateTrackPlayConfig = () => {
  if (layerRef.value && hasTrack.value && tracks.value.length > 0) {
    const trackId = tracks.value[0].id;
    
    // 鑾峰彇鎾斁鐘舵€?    const isPlaying = layerRef.value.isTrackPlaying && layerRef.value.isTrackPlaying(track
Id);
    
    if (isPlaying) {
      // 濡傛灉姝ｅ湪鎾斁锛屽簲鐢ㄦ柊閰嶇疆
      layerRef.value.updateTrackPlayer(trackId, {
        loop: trackPlayLoop.value,
        speed: trackPlaySpeed.value,
        withCamera: trackPlayWithCamera.value,
        showNodes: trackPlayShowNodes.value,
        showNodeAnchors: true,       // 濮嬬粓鏄剧ず鑺傜偣閿氱偣
        showNodeNames: true,         // 鏄剧ず鑺傜偣鍚嶇О
        showNodeTime: true,          // 鏄剧ず鑺傜偣鏃堕棿
        showPointNames: true,        // 鏄剧ず绉诲姩鐐逛綅鍚嶇О
        showSpeed: true,             // 鏄剧ず閫熷害淇℃伅
        showNodeSpeed: true          // 鏄剧ず鑺傜偣閫熷害
      });
      
      // 鑾峰彇鍦板浘瀵硅薄骞惰Е鍙戞覆鏌?      const map = layerRef.value.getMapObject();
      if (map) {
        // 瑙﹀彂鍦板浘娓叉煋浠ユ洿鏂癠I
        map.render();
      }
      
      addLog('閰嶇疆', `宸叉洿鏂拌建杩规挱鏀鹃厤缃? 閫熷害=${trackPlaySpeed.value}km/h, 寰幆=${trackPlayLoop.value}, 璺熼殢鐩告満=${t
rackPlayWithCamera.value}, 鏄剧ず鑺傜偣=${trackPlayShowNodes.value}, 鏄剧ず鑺傜偣鍚嶇О=true, 鏄剧ず鑺傜偣鏃堕棿=true`);
    }
  }
};

// 璁＄畻鍙鏍囪鐐规暟閲?const visibleMarkerCount = computed(() => {
  return markers.value.filter(marker => marker.visible).length;
});

// 浜嬩欢鏃ュ織
const logs = reactive([]);

// 瀹夊叏鍦拌幏鍙朓D鐨勫悗8浣嶅瓧绗?function safeSlice(id: any): string {
  if (!id) return '鏃營D';
  return typeof id === 'string' ? id.slice(-8) : String(id);
}

// 娣诲姞鏃ュ織
function addLog(type, message) {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, 
'0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  
  logs.unshift({
    time: timeStr,
    type: type,
    message: message
  });
  
  // 鍙繚鐣欐渶杩?0鏉℃棩蹇?  if (logs.length > 10) {
    logs.pop();
  }
}

// 鍦板浘鍒濆鍖栧畬鎴愬洖璋?function onMapInit(mapInstance) {
  addLog('鍒濆鍖?, '鍦板浘鍔犺浇瀹屾垚');
  console.log('鍦板浘瀹炰緥:', mapInstance);
  
  // 娣诲姞涓€涓腑蹇冩爣璁扮偣
  addCenterMarker();
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
  
  // 鏇存柊鍥惧眰绫诲瀷鏄剧ず
  updateLayerTypeDisplay();
  
  // 鍒濆鍖栨椂娣诲姞榛樿鐑姏鍥惧苟閫夋嫨绗竴鏉¤褰?  setTimeout(() => {
    // 閫変腑绗竴鏉＄儹鍔涚偣
    selectFirstHeatmapPoint();
  }, 500);
}

/**
 * 閫変腑绗竴鏉＄儹鍔涚偣
 */
const selectFirstHeatmapPoint = () => {
  if (heatmapPoints.value.length > 0) {
    const firstPoint = heatmapPoints.value[0];
    if (firstPoint && firstPoint.id) {
      selectedHeatmapPoint.value = firstPoint.id;
      addLog('鐑姏鍥?, `宸查€変腑鐑姏鐐? ${firstPoint.name || '鏈懡鍚?}`);
    }
  }
};

/**
 * 閫夋嫨鐑姏鐐? */
  selectedHeatmapPoint.value = id;
  const point = heatmapPoints.value.find(p => p.id === id);
  if (point) {
    addLog('鐑姏鍥?, `宸查€変腑鐑姏鐐? ${point.name || '鏈懡鍚?}`);
  }
};

// 鍦板浘鐐瑰嚮浜嬩欢
function onMapClick(evt) {
  const coordinates = evt.coordinates;
  addLog('鐐瑰嚮', `鍦板浘鍧愭爣: [${coordinates[0].toFixed(4)}, ${coordinates[1].toFixed(4)}]`);
}

// 鏍囪鐐瑰嚮浜嬩欢
function onMarkerClick(evt) {
  const data = evt.data;
  const markerId = data?.id;
  addLog('鐐瑰嚮', `鏍囪鐐? ${data.title || '鏈懡鍚?} [ID: ${safeSlice(markerId)}]`);
}

// 娣诲姞涓績鏍囪鐐?function addCenterMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  const markerId = layerRef.value.addMarker({
    id: 'center-marker',
    position: [centerLon, centerLat],
    title: '涓績鐐?,
    clickable: true,
    usePopover: true,
    data: { type: 'center', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>杩欐槸鍦板浘涓績鐐?/p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', '宸叉坊鍔犱腑蹇冩爣璁扮偣');
}

// 娣诲姞闅忔満鏍囪鐐?function addRandomMarkers(count) {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍙敤鐨勫浘鏍囩被鍨?  const iconTypes = ['url', 'svg', 'base64', 'default'];
  // 涓€浜涢瀹氫箟鐨勯殢鏈篣RL鍥炬爣
  const iconUrls = [
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-1.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-2.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-3.png',
    'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
  ];
  // 闅忔満棰滆壊
  const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96', '#fa541c'];
  // 闅忔満鍒嗙粍
  const groups = ['鏅偣', '椁愬巺', '浜ら€?, '璐墿', null]; // null琛ㄧず涓嶅垎缁?  
  for (let i = 0; i < count; i++) {
    const offsetLon = (Math.random() - 0.5) * 0.1;
    const offsetLat = (Math.random() - 0.5) * 0.1;
    
    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;
    
    const id = `marker-${Date.now()}-${i}`;
    const usePopover = Math.random() > 0.5; // 闅忔満鍐冲畾鏄惁浣跨敤popover
    
    // 闅忔満閫夋嫨涓€涓浘鏍囩被鍨?    const iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)];
    // 闅忔満閫夋嫨涓€涓鑹?    const color = colors[Math.floor(Math.random() * colors.length)];
    // 闅忔満閫夋嫨涓€涓垎缁?    const group = groups[Math.floor(Math.random() * groups.length)];
    
    // 鍑嗗鍥炬爣
    let icon;
    // 鍒涘缓SVG鍥炬爣
    const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2
000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${color}"/><circle cx="12" cy="12" r="6" fi
ll="white"/></svg>`;
    
    // 鏍规嵁涓嶅悓鍥炬爣绫诲瀷鍑嗗鍥炬爣鍐呭
    switch (iconType) {
      case 'svg':
        // 鐩存帴浼犻€扴VG瀛楃涓?        icon = iconSvg;
        break;
      case 'url':
        // 浣跨敤URL鍥炬爣
        icon = iconUrls[Math.floor(Math.random() * iconUrls.length)];
        break;
      case 'base64':
        // 浣跨敤base64缂栫爜鐨勫浘鏍?        icon = 'data:image/svg+xml;base64,' + btoa(iconSvg);
        break;
      case 'default':
      default:
        // 榛樿鍥炬爣
        icon = iconSvg;
        break;
    }
    
    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `鏍囪 ${i + 1} (${iconType})${group ? ' - ' + group : ''}`,
      icon: icon,
      iconType: iconType,
      clickable: true,
      usePopover: usePopover,
      group: group, // 璁剧疆鍒嗙粍灞炴€?      data: { type: 'random', index: i }
    });
  }
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  // 鏇存柊鍒嗙粍鍒楄〃
  updateMarkerGroups();
  
  addLog('鎿嶄綔', `宸叉坊鍔?${count} 涓殢鏈烘爣璁扮偣 (涓嶅悓鍥炬爣绫诲瀷${count > 1 ? '鍜屽垎缁? : ''})`);
}

// 娣诲姞褰╄壊鏍囪鐐?function addColoredMarkers() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 瀹氫箟鍥涗釜鏂瑰悜鍜岄鑹?  const directions = [
    { name: '涓?, offset: [0.05, 0], color: '#1890ff', usePopover: true, iconType: 'svg' },
    { name: '鍗?, offset: [0, -0.05], color: '#52c41a', usePopover: false, iconType: 'url' },
    { name: '瑗?, offset: [-0.05, 0], color: '#faad14', usePopover: true, iconType: 'base64' },
    { name: '鍖?, offset: [0, 0.05], color: '#722ed1', usePopover: false, iconType: 'default' }
  ];
  
  directions.forEach((dir, index) => {
    const id = `direction-${dir.name}-marker`;
    const lon = centerLon + dir.offset[0];
    const lat = centerLat + dir.offset[1];
    
    // 鍒涘缓SVG鍥炬爣
    const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2
000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${dir.color}"/><circle cx="12" cy="12" r="6
" fill="white"/></svg>`;
    
    // 鏍规嵁涓嶅悓鍥炬爣绫诲瀷鍑嗗鍥炬爣鍐呭
    let icon;
    switch (dir.iconType) {
      case 'svg':
        // 鐩存帴浼犻€扴VG瀛楃涓?        icon = iconSvg;
        break;
      case 'url':
        // 浣跨敤URL鍥炬爣
        icon = 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-' + (index + 1) + '.png'
;
        break;
      case 'base64':
        // 浣跨敤base64缂栫爜鐨勫浘鏍?        icon = 'data:image/svg+xml;base64,' + btoa(iconSvg);
        break;
      case 'default':
      default:
        // 榛樿浣跨敤SVG浣滀负鍐呭
        icon = iconSvg;
        break;
    }
    
    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `${dir.name}鏂瑰悜 (${dir.iconType})`,
      icon: icon,
      iconType: dir.iconType,
      clickable: true,
      usePopover: dir.usePopover,
      data: { type: 'direction', name: dir.name },
      style: {
        scale: 1,
        textColor: dir.color
      }
    });
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', '宸叉坊鍔犲洓涓柟鍚戝僵鑹叉爣璁扮偣 (涓嶅悓鍥炬爣绫诲瀷)');
}

// 娣诲姞鑱氬悎鏍囪鐐?function addClusterMarkers() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 娣诲姞10涓仛鍚堟爣璁扮偣
  for (let i = 0; i < 10; i++) {
    // 闅忔満鐢熸垚鍧愭爣 (杈冭繎鐨勮寖鍥翠互渚胯仛鍚?
    const offsetLon = (Math.random() - 0.5) * 0.02;
    const offsetLat = (Math.random() - 0.5) * 0.02;
    
    const lon = centerLon + offsetLon;
    const lat = centerLat + offsetLat;
    
    // 闅忔満鐢熸垚ID
    const id = `cluster-${Date.now()}-${i}`;
    
    // 娣诲姞鏍囪鐐?    layerRef.value.addMarker({
      id,
      position: [lon, lat],
      title: `鑱氬悎鐐?${i + 1}`,
      clickable: true,
      clusterMode: MarkerClusterMode.CLUSTER,
      data: { type: 'cluster', index: i }
    });
  }
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', '宸叉坊鍔?0涓仛鍚堟爣璁扮偣');
}

// 娓呴櫎鎵€鏈夋爣璁?function clearAllMarkers() {
  if (!layerRef.value) return;
  
  layerRef.value.clearMarkers();
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', '宸叉竻闄ゆ墍鏈夋爣璁扮偣');
}

// 鍒囨崲鎵€鏈夋爣璁扮偣鐨勫彲瑙佹€?function toggleAllMarkers() {
  if (!layerRef.value) return;
  
  if (allMarkersVisible.value) {
    // 濡傛灉褰撳墠鏍囪鐐瑰彲瑙侊紝鍒欓殣钘忔墍鏈?    layerRef.value.hideAllMarkers();
    allMarkersVisible.value = false;
    addLog('鎿嶄綔', '宸查殣钘忔墍鏈夋爣璁扮偣');
  } else {
    // 濡傛灉褰撳墠鏍囪鐐归殣钘忥紝鍒欐樉绀烘墍鏈?    layerRef.value.showAllMarkers();
    allMarkersVisible.value = true;
    addLog('鎿嶄綔', '宸叉樉绀烘墍鏈夋爣璁扮偣');
  }
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
}

// 鍒囨崲鎵€鏈夋爣璁扮偣鏍囩鐨勫彲瑙佹€?function toggleAllLabels() {
  if (!layerRef.value) return;
  
  if (allLabelsVisible.value) {
    // 濡傛灉褰撳墠鏍囩鍙锛屽垯闅愯棌鎵€鏈?    layerRef.value.hideAllLabels();
    allLabelsVisible.value = false;
    addLog('鎿嶄綔', '宸查殣钘忔墍鏈夋爣璁扮偣鏍囩');
  } else {
    // 濡傛灉褰撳墠鏍囩闅愯棌锛屽垯鏄剧ず鎵€鏈?    layerRef.value.showAllLabels();
    allLabelsVisible.value = true;
    addLog('鎿嶄綔', '宸叉樉绀烘墍鏈夋爣璁扮偣鏍囩');
  }
}

// 鍒囨崲鏍囪鐐瑰彲瑙佹€?function toggleMarkerVisibility(marker: any) {
  if (!layerRef.value) return;
  
  if (marker.visible) {
    layerRef.value.hideMarker(marker.id);
    addLog('鎿嶄綔', `宸查殣钘忔爣璁扮偣: ${safeSlice(marker.id)}`);
  } else {
    layerRef.value.showMarker(marker.id);
    addLog('鎿嶄綔', `宸叉樉绀烘爣璁扮偣: ${safeSlice(marker.id)}`);
  }
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
}

// 鍒囨崲鏍囪鐐筆opover鏄剧ず鐘舵€?function toggleMarkerPopover(marker: any) {
  if (!layerRef.value) return;
  
  const showPopover = !marker.showPopover;
  layerRef.value.updateMarker(marker.id, {
    showPopover: showPopover
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', `宸?{showPopover ? '鏄剧ず' : '闅愯棌'}鏍囪鐐?${safeSlice(marker.id)} 鐨凱opover`);
}

// 绉诲姩鏍囪鐐?function moveMarker(marker: any) {
  if (!layerRef.value) return;
  
  // 闅忔満绉诲姩涓€鐐硅窛绂?  const lon = marker.position[0] + (Math.random() - 0.5) * 0.01;
  const lat = marker.position[1] + (Math.random() - 0.5) * 0.01;
  
  layerRef.value.updateMarker(marker.id, {
    position: [lon, lat]
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', `宸茬Щ鍔ㄦ爣璁扮偣: ${safeSlice(marker.id)}`);
}

// 鍒犻櫎鏍囪鐐?function removeMarker(marker: any) {
  if (!layerRef.value) return;
  
  layerRef.value.removeMarker(marker.id);
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', `宸插垹闄ゆ爣璁扮偣: ${safeSlice(marker.id)}`);
}

// 鏇存柊鏍囪鐐瑰垪琛?function updateMarkerList() {
  if (!layerRef.value) return;
  
  const allMarkers = layerRef.value.getAllMarkers() || [];
  markers.value = allMarkers;
  
  // 鏇存柊鍏ㄥ眬鏍囪鐐瑰彲瑙佺姸鎬?  allMarkersVisible.value = allMarkers.filter(m => m.visible).length > 0;
  
  // 鏇存柊鍒嗙粍鍒楄〃
  updateMarkerGroups();
}

// 澶勭悊鍦板浘绫诲瀷鍙樻洿
function handleMapTypeChange() {
  if (!layerRef.value) return;
  
  layerRef.value.changeMapLayer(config.mapType, config.mapTile);
  
  // 鏇存柊鍥惧眰绫诲瀷鏄剧ず
  updateLayerTypeDisplay();
  
  addLog('鎿嶄綔', `鍒囨崲鍦板浘绫诲瀷涓? ${config.mapType}`);
}

// 澶勭悊鍥惧眰绫诲瀷鍙樻洿
function handleLayerTypeChange() {
  if (!layerRef.value) return;
  
  // 杞崲鍥惧眰绫诲瀷
  switch (tileType.value) {
    case 'normal':
      config.mapTile = MapTile.NORMAL;
      break;
    case 'satellite':
      config.mapTile = MapTile.SATELLITE;
      break;
    case 'hybrid':
      config.mapTile = MapTile.HYBRID;
      break;
    default:
      config.mapTile = MapTile.NORMAL;
  }
  
  // 鍒囨崲鍦板浘鍥惧眰
  layerRef.value.changeMapLayer(config.mapType, config.mapTile);
  
  addLog('鎿嶄綔', `鍒囨崲鍥惧眰绫诲瀷涓? ${getMapTileName(config.mapTile)}`);
}

// 澶勭悊缂╂斁绾у埆鍙樻洿
function handleZoomChange() {
  if (!layerRef.value) return;
  
  // 璁剧疆缂╂斁
  layerRef.value.getMapObject().setZoom(config.zoom);
  addLog('鎿嶄綔', `璁剧疆缂╂斁绾у埆涓? ${config.zoom}`);
}

// 澶勭悊浜や簰鎺у埗鍙樻洿
function handleInteractionChange() {
  if (!layerRef.value) return;
  
  addLog('鐢ㄦ埛浜や簰', `鍦板浘浜や簰鐘舵€佸彉鏇? 鎷栧姩=${config.dragging}, 婊氳疆缂╂斁=${config.scrollWheelZoom}`);
  
  layerRef.value.setInteractions({
    dragging: config.dragging,
    scrollWheelZoom: config.scrollWheelZoom
  });
}

// 澶勭悊姣斾緥灏烘樉绀哄彉鍖?function handleScaleLineChange() {
  if (!layerRef.value) return;
  
  addLog('姣斾緥灏?, `姣斾緥灏烘樉绀虹姸鎬? ${config.showScaleLine ? '鏄剧ず' : '闅愯棌'}`);
  
  // 娉ㄦ剰锛氱敱浜庝娇鐢╬rops浼犻€掞紝閰嶇疆鍙樻洿浼氳嚜鍔ㄦ洿鏂帮紝涓嶉渶瑕侀澶栬皟鐢ㄦ柟娉?}

// 娣诲姞榛樿鏄剧ずPopover鏍囪
function addPopoverMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  const markerId = layerRef.value.addMarker({
    id: 'pop-marker',
    position: [centerLon, centerLat],
    title: 'Popover鏍囪',
    clickable: true,
    usePopover: true,
    showPopover: true,
    data: { type: 'pop', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>杩欐槸榛樿鏄剧ずPopover鐨勬爣璁?/p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', '宸叉坊鍔犻粯璁ゆ樉绀篜opover鐨勬爣璁?);
}

// 娣诲姞甯︽ā鏉跨殑鏍囪鐐?function addTemplateMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍚戝彸渚у亸绉讳綅缃?  const lon = centerLon + 0.005;
  const lat = centerLat;
  
  const markerId = layerRef.value.addMarker({
    id: 'template-marker',
    position: [lon, lat],
    title: '甯︽ā鏉挎爣璁?,
    clickable: true,
    usePopover: false,
    data: { type: 'template', importance: 'high' },
    template: '<div><h3>{{title}}</h3><p>杩欐槸甯︽ā鏉跨殑鏍囪</p></div>',
    style: {
      scale: 1.2,
      textColor: '#f00',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', '宸叉坊鍔犲甫妯℃澘鐨勬爣璁扮偣锛岀偣鍑绘椂涓嶄細鏄剧ずpopover');
}

// 娣诲姞鏃犳ā鏉跨殑鏍囪鐐?function addNoTemplateMarker() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍚戝乏渚у亸绉讳綅缃?  const lon = centerLon - 0.005;
  const lat = centerLat;
  
  const markerId = layerRef.value.addMarker({
    id: 'no-template-marker',
    position: [lon, lat],
    title: '鏃犳ā鏉挎爣璁?,
    clickable: true,
    usePopover: true,
    data: { type: 'no-template', importance: 'high' },
    style: {
      scale: 1.2,
      textColor: '#00a',
      textFont: 'bold 14px Arial'
    }
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  addLog('鎿嶄綔', '宸叉坊鍔犳棤妯℃澘鐨勬爣璁扮偣锛屽皢鍦ㄧ偣鍑绘椂鏄剧ずpopover');
}

// 娣诲姞姝ｆ柟褰㈠浘褰?function addSquareShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍒涘缓涓€涓鏂瑰舰锛岃竟闀夸负500绫?  const id = layerRef.value.addSquare(
    [centerLon, centerLat], 
    500, 
    {
      id: `square-${Date.now()}`,
      style: {
        fill: { color: 'rgba(255, 165, 0, 0.3)' },
        stroke: { color: 'orange', width: 3 }
      },
      data: { type: 'square', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('鎿嶄綔', `宸叉坊鍔犳鏂瑰舰鍥惧舰锛孖D: ${id}`);
}

// 娣诲姞鍦嗗舰鍥惧舰
function addCircleShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍚戝彸涓婅鍋忕Щ浣嶇疆
  const lon = centerLon + 0.01;
  const lat = centerLat + 0.01;
  
  // 鍒涘缓涓€涓渾锛屽崐寰勪负300绫?  const id = layerRef.value.addCircle(
    [lon, lat], 
    300, 
    {
      id: `circle-${Date.now()}`,
      style: {
        fill: { color: 'rgba(24, 144, 255, 0.3)' },
        stroke: { color: '#1890ff', width: 2 }
      },
      data: { type: 'circle', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('鎿嶄綔', `宸叉坊鍔犲渾褰㈠浘褰紝ID: ${id}`);
}

// 娣诲姞鐭╁舰鍥惧舰
function addRectangleShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍚戝乏涓嬭鍋忕Щ
  const minLon = centerLon - 0.02;
  const minLat = centerLat - 0.02;
  const maxLon = centerLon - 0.005;
  const maxLat = centerLat - 0.005;
  
  // 鍒涘缓涓€涓煩褰?  const id = layerRef.value.addRectangle(
    [minLon, minLat], 
    [maxLon, maxLat], 
    {
      id: `rectangle-${Date.now()}`,
      style: {
        fill: { color: 'rgba(82, 196, 26, 0.3)' },
        stroke: { color: '#52c41a', width: 2, lineDash: [5, 5] }
      },
      data: { type: 'rectangle', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('鎿嶄綔', `宸叉坊鍔犵煩褰㈠浘褰紝ID: ${id}`);
}

// 娣诲姞澶氳竟褰㈠浘褰?function addPolygonShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鏋勫缓涓夎褰㈢殑涓変釜椤剁偣
  const coordinates = [
    [centerLon + 0.02, centerLat],
    [centerLon + 0.01, centerLat + 0.015],
    [centerLon + 0.03, centerLat + 0.015],
  ];
  
  // 鍒涘缓涓€涓杈瑰舰锛堜笁瑙掑舰锛?  const id = layerRef.value.addPolygon(
    coordinates, 
    {
      id: `polygon-${Date.now()}`,
      style: {
        fill: { color: 'rgba(245, 34, 45, 0.3)' },
        stroke: { color: '#f5222d', width: 2 }
      },
      data: { type: 'polygon', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('鎿嶄綔', `宸叉坊鍔犲杈瑰舰鍥惧舰锛堜笁瑙掑舰锛夛紝ID: ${id}`);
}

// 娣诲姞绾挎鍥惧舰
function addLineShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍒涘缓涓€鏉＄嚎鐨勫潗鏍?  const coordinates = [
    [centerLon - 0.02, centerLat + 0.02],
    [centerLon, centerLat + 0.03],
    [centerLon + 0.02, centerLat + 0.02]
  ];
  
  // 鍒涘缓涓€鏉＄嚎
  const id = layerRef.value.addLine(
    coordinates, 
    {
      id: `line-${Date.now()}`,
      style: {
        stroke: { color: '#722ed1', width: 4, lineDash: [10, 5] }
      },
      data: { type: 'line', createdAt: new Date().toISOString() }
    }
  );
  
  addLog('鎿嶄綔', `宸叉坊鍔犵嚎娈靛浘褰紝ID: ${id}`);
}

// 娣诲姞鐐瑰浘褰?function addPointShape() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍚戜笂鏂瑰亸绉讳綅缃?  const lon = centerLon;
  const lat = centerLat + 0.02;
  
  // 鍒涘缓涓€涓偣
  const id = layerRef.value.addPoint(
    [lon, lat], 
    {
      id: `point-${Date.now()}`,
      style: {
        fill: { color: 'rgba(255, 0, 0, 0.8)' },
        stroke: { color: '#ffffff', width: 2 },
        radius: 8, // 鐐圭殑鍗婂緞
        zIndex: 10 // 缃簬鍏朵粬鍥惧舰涔嬩笂
      },
      data: { type: 'point', createdAt: new Date().toISOString() }
    }
  );
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
  addLog('鎿嶄綔', `宸叉坊鍔犵偣鍥惧舰锛孖D: ${id}`);
}

// 娣诲姞澶嶅悎鍥惧舰绀轰緥
function addCustomShapeExample() {
  if (!layerRef.value) return;
  
  const centerLon = config.center[1];
  const centerLat = config.center[0];
  
  // 鍒涘缓涓€涓鏂瑰舰浣滀负鍩虹
  const squareId = layerRef.value.addSquare(
    [centerLon, centerLat], 
    600, 
    {
      id: `complex-base-${Date.now()}`,
      style: {
        fill: { color: 'rgba(230, 230, 230, 0.5)' },
        stroke: { color: '#333333', width: 2 }
      },
      data: { type: 'complex-base', part: 'base' }
    }
  );
  
  // 鍦ㄥ洓涓娣诲姞鍦嗗舰
  const radius = 100;
  const offset = 300 * 0.7; // 姝ｆ柟褰㈢殑涓€鍗婁箻浠?.7锛屼娇鍦嗗湪瑙掕惤浣嶇疆
  
  // 鍙充笂瑙掑渾褰?  layerRef.value.addCircle(
    [centerLon + offset/111000, centerLat + offset/111000], 
    radius, 
    {
      id: `complex-circle-ne-${Date.now()}`,
      style: {
        fill: { color: 'rgba(24, 144, 255, 0.6)' },
        stroke: { color: '#1890ff', width: 2 }
      },
      data: { type: 'complex-part', part: 'northeast' }
    }
  );
  
  // 宸︿笂瑙掑渾褰?  layerRef.value.addCircle(
    [centerLon - offset/111000, centerLat + offset/111000], 
    radius, 
    {
      id: `complex-circle-nw-${Date.now()}`,
      style: {
        fill: { color: 'rgba(82, 196, 26, 0.6)' },
        stroke: { color: '#52c41a', width: 2 }
      },
      data: { type: 'complex-part', part: 'northwest' }
    }
  );
  
  // 宸︿笅瑙掑渾褰?  layerRef.value.addCircle(
    [centerLon - offset/111000, centerLat - offset/111000], 
    radius, 
    {
      id: `complex-circle-sw-${Date.now()}`,
      style: {
        fill: { color: 'rgba(250, 173, 20, 0.6)' },
        stroke: { color: '#faad14', width: 2 }
      },
      data: { type: 'complex-part', part: 'southwest' }
    }
  );
  
  // 鍙充笅瑙掑渾褰?  layerRef.value.addCircle(
    [centerLon + offset/111000, centerLat - offset/111000], 
    radius, 
    {
      id: `complex-circle-se-${Date.now()}`,
      style: {
        fill: { color: 'rgba(245, 34, 45, 0.6)' },
        stroke: { color: '#f5222d', width: 2 }
      },
      data: { type: 'complex-part', part: 'southeast' }
    }
  );
  
  // 娣诲姞涓績鐐?  layerRef.value.addPoint(
    [centerLon, centerLat], 
    {
      id: `complex-center-${Date.now()}`,
      style: {
        fill: { color: 'rgba(0, 0, 0, 0.8)' },
        stroke: { color: '#ffffff', width: 2 },
        radius: 10
      },
      data: { type: 'complex-part', part: 'center' }
    }
  );
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
  addLog('鎿嶄綔', '宸叉坊鍔犲鍚堝浘褰㈢ず渚?);
}

// 娓呴櫎鎵€鏈夊浘褰?function clearAllShapes() {
  if (!layerRef.value) return;
  
  layerRef.value.clearAllShapes();
  addLog('鎿嶄綔', '宸叉竻闄ゆ墍鏈夊浘褰?);
}

// 鍒囨崲鎵€鏈夊浘褰㈢殑鍙鎬?function toggleShapeVisible() {
  if (!layerRef.value || !layerRef.value.getShapeObject) return;
  
  const shapeObj = layerRef.value.getShapeObject();
  if (!shapeObj) return;
  
  if (allShapesVisible.value) {
    // 闅愯棌鎵€鏈夊浘褰?    shapes.value.forEach(shape => {
      if (shape.id) {
        layerRef.value.updateShape(shape.id, { visible: false });
      }
    });
    allShapesVisible.value = false;
    addLog('鎿嶄綔', '宸查殣钘忔墍鏈夊浘褰?);
  } else {
    // 鏄剧ず鎵€鏈夊浘褰?    shapes.value.forEach(shape => {
      if (shape.id) {
        layerRef.value.updateShape(shape.id, { visible: true });
      }
    });
    allShapesVisible.value = true;
    addLog('鎿嶄綔', '宸叉樉绀烘墍鏈夊浘褰?);
  }
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
}

// 闅忔満淇敼涓€涓浘褰㈢殑鏍峰紡
function modifyRandomShape() {
  if (!layerRef.value || shapes.value.length === 0) return;
  
  // 闅忔満閫夋嫨涓€涓浘褰?  const randomIndex = Math.floor(Math.random() * shapes.value.length);
  const shape = shapes.value[randomIndex];
  
  if (!shape || !shape.id) {
    addLog('鎿嶄綔', '娌℃湁鍙慨鏀圭殑鍥惧舰');
    return;
  }
  
  // 鐢熸垚闅忔満棰滆壊
  const randomColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.
floor(Math.random() * 255)}, 0.5)`;
  const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  
  // 淇敼鍥惧舰鏍峰紡
  layerRef.value.updateShape(shape.id, {
    style: {
      fill: { color: randomColor },
      stroke: { color: randomStrokeColor, width: Math.floor(Math.random() * 5) + 1 }
    }
  });
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
  addLog('鎿嶄綔', `宸查殢鏈轰慨鏀瑰浘褰㈡牱寮忥紝ID: ${safeSlice(shape.id)}`);
}

// 鏇存柊鍥惧舰鍒楄〃
function updateShapeList() {
  if (!layerRef.value || !layerRef.value.getAllShapes) return;
  
  const allShapes = layerRef.value.getAllShapeDatas() || [];
  shapes.value = allShapes;
  // 妫€鏌ュ浘褰㈠彲瑙佹€х姸鎬?  allShapesVisible.value = allShapes.length > 0 && allShapes.every(s => s.visible !== f
alse);
}

// 鑾峰彇鍥惧舰绫诲瀷鍚嶇О
function getShapeTypeName(type: string): string {
  const typeNames = {
    [ShapeType.POINT]: '鐐?,
    [ShapeType.LINE]: '绾?,
    [ShapeType.POLYGON]: '澶氳竟褰?,
    [ShapeType.CIRCLE]: '鍦嗗舰',
    [ShapeType.RECTANGLE]: '鐭╁舰',
    [ShapeType.SQUARE]: '姝ｆ柟褰?
  };
  
  return typeNames[type] || '鏈煡绫诲瀷';
}

// 鍒囨崲鍥惧舰鍙鎬?function toggleShapeVisibility(shape: any) {
  if (!layerRef.value) return;
  
  const newVisible = shape.visible === false; // 濡傛灉褰撳墠鏄殣钘忕殑锛屽垯鏄剧ず
  
  layerRef.value.updateShape(shape.id, {
    visible: newVisible
  });
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
  addLog('鎿嶄綔', `宸?{newVisible ? '鏄剧ず' : '闅愯棌'}鍥惧舰: ${safeSlice(shape.id)}`);
}

// 淇敼鍥惧舰鏍峰紡
function changeShapeStyle(shape: any) {
  if (!layerRef.value) return;
  
  // 鏍规嵁鍥惧舰绫诲瀷鐢熸垚涓嶅悓鐨勯殢鏈烘牱寮?  let style: any = {};
  
  // 闅忔満棰滆壊
  const randomFillColor = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${M
ath.floor(Math.random() * 255)}, 0.5)`;
  const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  
  // 鍩虹鏍峰紡
  style = {
    fill: { color: randomFillColor },
    stroke: { color: randomStrokeColor, width: Math.floor(Math.random() * 4) + 1 }
  };
  
  // 瀵逛簬鐐圭被鍨嬶紝澧炲姞鍗婂緞灞炴€?  if (shape.type === ShapeType.POINT) {
    style.radius = Math.floor(Math.random() * 10) + 5;
  }
  
  // 搴旂敤鏍峰紡鍙樻洿
  layerRef.value.updateShape(shape.id, { style });
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
  addLog('鎿嶄綔', `宸蹭慨鏀瑰浘褰㈡牱寮? ${safeSlice(shape.id)}`);
}

// 鍒犻櫎鍥惧舰
function removeShape(shape: any) {
  if (!layerRef.value) return;
  
  layerRef.value.removeShape(shape.id);
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
  addLog('鎿嶄綔', `宸插垹闄ゅ浘褰? ${safeSlice(shape.id)}`);
}


// 鏇存柊鏄剧ず鐨勫浘灞傜被鍨嬶紙鏍规嵁閰嶇疆涓殑瀹為檯鍊硷級
function updateLayerTypeDisplay() {
  // 鏍规嵁 config.mapTile 璁剧疆 tileType 鏄剧ず鍊?  switch (config.mapTile) {
    case MapTile.NORMAL:
      tileType.value = 'normal';
      break;
    case MapTile.SATELLITE:
      tileType.value = 'satellite';
      break;
    case MapTile.HYBRID:
      tileType.value = 'hybrid';
      break;
    default:
      tileType.value = 'normal';
  }
}

// 澶勭悊宸ュ叿鏍忕姸鎬佸彉鏇?function onToolbarStateChange(state) {
  const { toolId, active, toolType, data } = state;
  
  // 璁板綍宸ュ叿鏍忕姸鎬佸彉鍖?  addLog('宸ュ叿鏍?, `宸ュ叿ID: ${toolId}, 婵€娲荤姸鎬? ${active}, 绫诲瀷: ${toolType}`);
  
  // 妫€娴嬪浘灞傞潰鏉垮叧闂簨浠?  if (toolId === 'layer-switch' && !active) {
    addLog('鍥惧眰', '鍥惧眰閫夋嫨闈㈡澘宸插叧闂?);
    // 纭繚UI鏇存柊涓烘渶鏂扮殑鍥惧眰绫诲瀷
    updateLayerTypeDisplay();
  }
  
  // 妫€娴嬪浘灞傚彉鏇翠簨浠?  if (toolId === 'layer-change' && data) {
    addLog('鍥惧眰', `鍥惧眰宸插彉鏇翠负: ${data.mapType} - ${data.mapTile}`);
    // 鏇存柊鏈湴閰嶇疆
    config.mapType = data.mapType;
    config.mapTile = data.mapTile;
    // 鏇存柊UI鏄剧ず
    updateLayerTypeDisplay();
  }
}

// 鍒囨崲鍒版寚瀹氬湴鍥剧被鍨嬪拰鍥惧眰绫诲瀷
function switchToLayer(mapType: MapType, mapTile: MapTile) {
  if (!layerRef.value) return;
  
  // 鏇存柊鏈湴閰嶇疆
  config.mapType = mapType;
  config.mapTile = mapTile;
  
  // 鍒囨崲鍦板浘鍥惧眰
  layerRef.value.changeMapLayer(mapType, mapTile);
  
  // 鏇存柊UI鏄剧ず
  updateLayerTypeDisplay();
  
  addLog('鎿嶄綔', `鍒囨崲鍦板浘: ${mapType} - ${getMapTileName(mapTile)}`);
}

// 鑾峰彇鍥惧眰绫诲瀷鍚嶇О
function getMapTileName(mapTile: MapTile): string {
  switch (mapTile) {
    case MapTile.NORMAL:
      return '鏍囧噯鍥惧眰';
    case MapTile.SATELLITE:
      return '鍗槦鍥惧眰';
    case MapTile.HYBRID:
      return '娣峰悎鍥惧眰';
    default:
      return '鏈煡鍥惧眰';
  }
}

// 娣诲姞鏍囪鍒涘缓浜嬩欢澶勭悊鍑芥暟
function onMarkerCreate(evt) {
  const { id, options } = evt;
  const title = options.title || '鏈懡鍚嶆爣璁?;
  addLog('鍒涘缓', `鏍囪鐐瑰凡鍒涘缓: ${title} [ID: ${safeSlice(id)}]`);
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
}

// 娣诲姞鏍囪鏇存柊浜嬩欢澶勭悊鍑芥暟
function onMarkerUpdate(evt) {
  const { id, options } = evt;
  const position = options.position ? `[${options.position[0].toFixed(4)}, ${options.position[1].toFixed(4)
}]` : '浣嶇疆鏈彉';
  addLog('鏇存柊', `鏍囪鐐瑰凡鏇存柊: [ID: ${safeSlice(id)}] ${position}`);
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
}

// 娣诲姞鏍囪鍒犻櫎浜嬩欢澶勭悊鍑芥暟
function onMarkerDelete(evt) {
  const { id } = evt;
  addLog('鍒犻櫎', `鏍囪鐐瑰凡鍒犻櫎: [ID: ${safeSlice(id)}]`);
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
}

// 娣诲姞鍥惧舰鍒涘缓浜嬩欢澶勭悊鍑芥暟
function onShapeCreate(evt) {
  const { id, options } = evt;
  const type = getShapeTypeName(options.type);
  addLog('鍒涘缓', `鍥惧舰宸插垱寤? ${type} [ID: ${safeSlice(id)}]`);
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
}

// 娣诲姞鍥惧舰鏇存柊浜嬩欢澶勭悊鍑芥暟
function onShapeUpdate(evt) {
  const { id, options } = evt;
  addLog('鏇存柊', `鍥惧舰宸叉洿鏂? [ID: ${safeSlice(id)}]`);
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
}

// 娣诲姞鍥惧舰鍒犻櫎浜嬩欢澶勭悊鍑芥暟
function onShapeDelete(evt) {
  const { id } = evt;
  addLog('鍒犻櫎', `鍥惧舰宸插垹闄? [ID: ${safeSlice(id)}]`);
  
  // 鏇存柊鍥惧舰鍒楄〃
  updateShapeList();
}

// 娣诲姞绀轰緥杞ㄨ抗
const addSampleTrack = () => {
  try {
    // 鍒涘缓绀轰緥杞ㄨ抗鏁版嵁
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    
    // 鐢熸垚涓€鏉＄畝鍗曠殑杞ㄨ抗锛屾部鐫€褰撳墠瑙嗗浘涓績鍚戜笢鍓嶈繘
    for (let i = 0; i < 20; i++) {
      const offset = i * 0.005; // 姣忔楠ょЩ鍔ㄧ殑璺濈
      points.push({
        lat: center[0], 
        lng: center[1] + offset,
        time: now + i * 60, // 姣忓垎閽熶竴涓偣
        dir: 90,  // 鍚戜笢
        title: `杞ㄨ抗鐐?${i+1}`,
        // 娣诲姞鑷畾涔夊浘鏍囷紝绗竴涓偣浣跨敤涓€涓壒娈婂浘鏍?        iconUrl: i === 0 ? 'https://a.amap.com/jsapi_demos/static
/demo-center/icons/poi-marker-1.png' : undefined,
        iconSize: [24, 24],
        info: [
          { key: '鏃堕棿', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '閫熷害', value: '45 km/h' },
          { key: '鏂瑰悜', value: '90掳' }
        ]
      } as any);
    }
    
    // 鍒涘缓杞ㄨ抗瀵硅薄
    const track = {
      id: 'sample-track-' + Math.floor(Math.random() * 1000),
      name: '绀轰緥杞ㄨ抗',
      points: points,
      color: '#FF5252',
      visible: true
    };
    
    // 娣诲姞杞ㄨ抗
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `宸叉坊鍔犵ず渚嬭建杩癸紝鍖呭惈 ${points.length} 涓偣`);
    } else {
      addLog('error', '鑾峰彇杞ㄨ抗瀵硅薄澶辫触');
    }
  } catch (e) {
    addLog('error', `娣诲姞绀轰緥杞ㄨ抗澶辫触: ${e}`);
  }
};

// 娣诲姞澶嶆潅杞ㄨ抗绀轰緥
const addComplexTrack = () => {
  try {
    // 鑾峰彇鍦板浘涓績鐐?    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    
    // 瀹氫箟澶嶆潅杞ㄨ抗鐨勫叧閿偣 - 鍖呭惈澶氫釜杞集鐐?    const keyPoints = [
      { lat: center[0], lng: center[1], name: '璧风偣', icon: 'https://a.amap.com/jsapi_demos/static/demo-cent
er/icons/start.png' },
      { lat: center[0] + 0.02, lng: center[1] + 0.02, name: '杞集鐐?', icon: 'https://a.amap.com/jsapi_demos/
static/demo-center/icons/poi-marker-1.png' },
      { lat: center[0] + 0.03, lng: center[1], name: '杞集鐐?', icon: 'https://a.amap.com/jsapi_demos/static/
demo-center/icons/poi-marker-2.png' },
      { lat: center[0] + 0.01, lng: center[1] - 0.02, name: '杞集鐐?', icon: 'https://a.amap.com/jsapi_demos/
static/demo-center/icons/poi-marker-3.png' },
      { lat: center[0] - 0.01, lng: center[1] - 0.03, name: '杞集鐐?', icon: 'https://a.amap.com/jsapi_demos/
static/demo-center/icons/poi-marker-4.png' },
      { lat: center[0] - 0.02, lng: center[1] - 0.01, name: '杞集鐐?', icon: 'https://a.amap.com/jsapi_demos/
static/demo-center/icons/warning.png' },
      { lat: center[0] - 0.01, lng: center[1] + 0.01, name: '缁堢偣', icon: 'https://a.amap.com/jsapi_demos/st
atic/demo-center/icons/end.png' },
    ];
    
    // 涓烘瘡涓叧閿偣涔嬮棿鎻掑叆涓棿鐐癸紝浣胯矾寰勬洿骞虫粦
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const start = keyPoints[i];
      const end = keyPoints[i + 1];
      const steps = 8; // 姣忔鍏抽敭鐐逛箣闂存彃鍏?涓腑闂寸偣
      
      for (let j = 0; j <= steps; j++) {
        const ratio = j / steps;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lng = start.lng + (end.lng - start.lng) * ratio;
        
        // 璁＄畻鏂瑰悜锛堜娇鐢ㄧ畝鍗曠殑瑙掑害璁＄畻锛?        const direction = Math.atan2(end.lat - start.lat, end.lng - start
.lng) * (180 / Math.PI);
        
        // 璁剧疆鐐逛綅鐨勬椂闂达紝姣忕偣闂撮殧30绉?        const time = now + (i * steps + j) * 30;
        
        // 鍒涘缓杞ㄨ抗鐐?        const point = {
          lat,
          lng,
          time,
          dir: direction,
          title: j === 0 ? start.name : (j === steps ? end.name : `璺嚎鐐?${points.length + 1}`),
          info: [
            { key: '鏃堕棿', value: new Date(time * 1000).toLocaleTimeString() },
            { key: '绫诲瀷', value: j === 0 ? '鍏抽敭鐐? : '璺嚎鐐? },
            { key: '鏂瑰悜', value: `${Math.round(direction)}掳` }
          ]
        } as any; // 浣跨敤绫诲瀷鏂█瑙ｅ喅TypeScript绫诲瀷闂
        
        // 涓哄叧閿偣娣诲姞鑷畾涔夊浘鏍?        if (j === 0) {
          point.iconUrl = start.icon;
          point.iconSize = [32, 32]; // 鍏抽敭鐐逛娇鐢ㄥぇ涓€鐐圭殑鍥炬爣
        } else if (j === steps && i === keyPoints.length - 2) {
          // 鏈€鍚庝竴涓偣锛堢粓鐐癸級
          point.iconUrl = end.icon;
          point.iconSize = [32, 32];
        }
        
        points.push(point);
      }
    }
    
    // 鍒涘缓杞ㄨ抗瀵硅薄
    const track = {
      id: 'complex-track-' + Math.floor(Math.random() * 1000),
      name: '澶嶆潅杞ㄨ抗绀轰緥',
      points: points,
      color: '#1890FF', // 钃濊壊
      visible: true
    };
    
    // 娣诲姞杞ㄨ抗
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `宸叉坊鍔犲鏉傝建杩癸紝鍖呭惈 ${points.length} 涓偣锛?{keyPoints.length} 涓叧閿偣`);
      
      // 鑷姩灏嗗湴鍥捐鍥捐皟鏁村埌鍖呭惈鏁翠釜杞ㄨ抗
      layerRef.value.fitTrackToView(track.id, {
        padding: [50, 50, 50, 50],
        maxZoom: 14
      });
    } else {
      addLog('error', '鑾峰彇杞ㄨ抗瀵硅薄澶辫触');
    }
  } catch (e) {
    addLog('error', `娣诲姞澶嶆潅杞ㄨ抗澶辫触: ${e}`);
  }
};

// 娣诲姞澶氭潯杞ㄨ抗
const addMultipleTrack = () => {
  try {
    const center = config.center;
    const tracksToAdd = [];
    
    // 鐢熸垚鍥涙潯涓嶅悓鏂瑰悜鐨勮建杩?    const directions = ['north', 'east', 'south', 'west'];
    const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107'];
    
    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i];
      const points = generateDirectionalTrack(center, direction, 0.05, 10);
      
      tracksToAdd.push({
        id: `track-${direction}-${Math.floor(Math.random() * 1000)}`,
        name: `${getDirectionName(direction)}鍚戣建杩筦,
        points: points,
        color: colors[i],
        visible: true
      });
    }
    
    // 娣诲姞鎵€鏈夎建杩?    if (layerRef.value) {
      let addedCount = 0;
      tracksToAdd.forEach(track => {
        try {
          layerRef.value.addTrack(track);
          tracks.value.push(track);
          addedCount++;
        } catch (e) {
          addLog('error', `娣诲姞杞ㄨ抗 ${track.name} 澶辫触: ${e}`);
        }
      });
      
      if (addedCount > 0) {
        hasTrack.value = true;
        addLog('info', `宸叉坊鍔?${addedCount} 鏉¤建杩筦);
      } else {
        addLog('warn', '鏈兘娣诲姞浠讳綍杞ㄨ抗');
      }
    } else {
      addLog('error', '鑾峰彇杞ㄨ抗瀵硅薄澶辫触');
    }
  } catch (e) {
    addLog('error', `娣诲姞澶氭潯杞ㄨ抗澶辫触: ${e}`);
  }
};

// 娣诲姞鐜舰杞ㄨ抗
const addCircularTrack = () => {
  try {
    // 鍒涘缓鍦嗗舰杞ㄨ抗鏁版嵁
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const radius = 0.02; // 鍗婂緞
    const totalPoints = 36; // 鐐规暟閲?    
    // 鐢熸垚涓€涓渾褰㈣建杩?    for (let i = 0; i <= totalPoints; i++) {
      const angle = (i / totalPoints) * Math.PI * 2;
      const lat = center[0] + Math.sin(angle) * radius;
      const lng = center[1] + Math.cos(angle) * radius;
      
      // 璁＄畻鏂瑰悜瑙掑害锛堝垏绾挎柟鍚戯級
      const direction = (angle * (180 / Math.PI) + 90) % 360;
      
      points.push({
        lat,
        lng,
        time: now + i * 60, // 姣忓垎閽熶竴涓偣
        dir: direction,
        title: `鐜舰杞ㄨ抗鐐?${i+1}`,
        info: [
          { key: '鏃堕棿', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '閫熷害', value: '30 km/h' },
          { key: '鏂瑰悜', value: `${Math.round(direction)}掳` }
        ]
      });
    }
    
    // 鍒涘缓杞ㄨ抗瀵硅薄
    const track = {
      id: 'circular-track-' + Math.floor(Math.random() * 1000),
      name: '鐜舰杞ㄨ抗',
      points: points,
      color: '#9C27B0', // 绱壊
      visible: true
    };
    
    // 娣诲姞杞ㄨ抗
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `宸叉坊鍔犵幆褰㈣建杩癸紝鍖呭惈 ${points.length} 涓偣`);
    } else {
      addLog('error', '鑾峰彇杞ㄨ抗瀵硅薄澶辫触');
    }
  } catch (e) {
    addLog('error', `娣诲姞鐜舰杞ㄨ抗澶辫触: ${e}`);
  }
};

// 娣诲姞Z瀛楀瀷杞ㄨ抗
const addZigzagTrack = () => {
  try {
    // 鐢熸垚Z瀛楀舰杞ㄨ抗
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
  
    // Z瀛楀舰鐨勪簲涓叧閿偣
    const keyPoints = [
      { lat: center[0] - 0.02, lng: center[1] - 0.02 }, // 宸︿笂
      { lat: center[0] - 0.02, lng: center[1] + 0.02 }, // 鍙充笂
      { lat: center[0], lng: center[1] - 0.01 }, // 涓棿
      { lat: center[0] + 0.02, lng: center[1] - 0.02 }, // 宸︿笅
      { lat: center[0] + 0.02, lng: center[1] + 0.02 }, // 鍙充笅
    ];
    
    // 涓烘瘡涓叧閿偣涔嬮棿鎻掑叆涓棿鐐?    for (let i = 0; i < keyPoints.length - 1; i++) {
      const start = keyPoints[i];
      const end = keyPoints[i + 1];
      const steps = 5; // 姣忔鎻掑叆5涓偣
      
      for (let j = 0; j <= steps; j++) {
        const ratio = j / steps;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lng = start.lng + (end.lng - start.lng) * ratio;
        
        // 璁＄畻鏂瑰悜锛堜娇鐢ㄧ畝鍗曠殑瑙掑害璁＄畻锛?        const direction = Math.atan2(end.lat - start.lat, end.lng - start
.lng) * (180 / Math.PI);
        
        points.push({
          lat,
          lng,
          time: now + (i * steps + j) * 60, // 姣忓垎閽熶竴涓偣
          dir: direction,
          title: `Z瀛楀舰杞ㄨ抗鐐?${points.length + 1}`,
          info: [
            { key: '鏃堕棿', value: new Date((now + (i * steps + j) * 60) * 1000).toLocaleTimeString() },
            { key: '閫熷害', value: '40 km/h' },
            { key: '鏂瑰悜', value: `${Math.round(direction)}掳` }
          ]
        });
      }
    }
    
    // 鍒涘缓杞ㄨ抗瀵硅薄
    const track = {
      id: 'zigzag-track-' + Math.floor(Math.random() * 1000),
      name: 'Z瀛楀舰杞ㄨ抗',
      points: points,
      color: '#E74C3C', // 绾㈣壊
      visible: true
    };
    
    // 娣诲姞杞ㄨ抗
    if (layerRef.value) {
      layerRef.value.addTrack(track);
      tracks.value.push(track);
      hasTrack.value = true;
      addLog('info', `宸叉坊鍔燴瀛楀舰杞ㄨ抗锛屽寘鍚?${points.length} 涓偣`);
    } else {
      addLog('error', '鑾峰彇杞ㄨ抗瀵硅薄澶辫触');
    }
  } catch (e) {
    addLog('error', `娣诲姞Z瀛楀舰杞ㄨ抗澶辫触: ${e}`);
  }
};

// 鎾斁杞ㄨ抗
const playTrack = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '娌℃湁鍙挱鏀剧殑杞ㄨ抗');
      return;
    }
    
    if (!layerRef.value) {
      addLog('error', '鍦板浘缁勪欢鏈垵濮嬪寲');
      return;
    }
    
    // 灏濊瘯鎾斁绗竴鏉¤建杩?    const track = tracks.value[0];
    
    // 鑾峰彇鍦板浘瀵硅薄锛岀‘淇濆湴鍥惧凡姝ｇ‘鍒濆鍖?    const map = layerRef.value.getMapObject();
    if (!map) {
      addLog('error', '鑾峰彇鍦板浘瀵硅薄澶辫触');
      return;
    }
    
    // 浣跨敤閰嶇疆鍙橀噺璁剧疆鎾斁鍙傛暟
    const success = layerRef.value.playTrack(track.id, {
      // 浣跨敤閰嶇疆鍙橀噺
      loop: trackPlayLoop.value,
      speed: trackPlaySpeed.value,
      withCamera: trackPlayWithCamera.value,
      speedFactor: 1.0,
      // 鏄剧ず璁剧疆
      showNodes: trackPlayShowNodes.value,
      showNodeAnchors: true,
      showNodeNames: true,  // 鏄剧ず鑺傜偣鍚嶇О
      showNodeTime: true,   // 鏄剧ず鑺傜偣鏃堕棿
      showPointNames: true, // 鏄剧ず绉诲姩鐐逛綅鍚嶇О
      showSpeed: true,      // 鏄剧ず閫熷害
      showNodeSpeed: true   // 鏄剧ず鑺傜偣閫熷害
    });
    
    if (success) {
      // 灏濊瘯婵€娲昏建杩规挱鏀惧櫒宸ュ叿
      layerRef.value.activateTool('track-player');
      
      // 瑙﹀彂涓€娆″湴鍥炬覆鏌擄紝纭繚鍔ㄧ敾寮€濮?      map.render();
      
      // 纭繚鍔ㄧ敾娴佺晠鎬э紝娣诲姞瀹氭椂鍣ㄥ畾鏈熻Е鍙戞覆鏌?      setTimeout(() => {
        // 鍐嶆瑙﹀彂涓€娆℃覆鏌擄紝閬垮厤鍒濆鍖栧欢杩熼棶棰?        map.render();
      }, 100);
      
      // 鏇存柊杞ㄨ抗閰嶇疆锛岀‘淇濊缃敓鏁?      layerRef.value.updateTrackPlayer(track.id, {
        showNodes: trackPlayShowNodes.value,
        showNodeAnchors: true,
        showNodeNames: true,  // 鏄剧ず鑺傜偣鍚嶇О
        showNodeTime: true,   // 鏄剧ず鑺傜偣鏃堕棿
        showPointNames: true, // 鏄剧ず绉诲姩鐐逛綅鍚嶇О
        showSpeed: true,      // 鏄剧ず閫熷害
        showNodeSpeed: true   // 鏄剧ず鑺傜偣閫熷害
      });
      
      addLog('info', `姝ｅ湪鎾斁杞ㄨ抗: ${track.name}锛岄€熷害: ${trackPlaySpeed.value} km/h锛屽惊鐜? ${trackPlayLoop.valu
e ? '鏄? : '鍚?}`);
    } else {
      addLog('error', `鎾斁杞ㄨ抗澶辫触: ${track.name}`);
    }
  } catch (e) {
    console.error('鎾斁杞ㄨ抗澶辫触:', e);
    addLog('error', `鎾斁杞ㄨ抗澶辫触: ${e}`);
  }
};

// 鍋滄杞ㄨ抗鎾斁
const stopTrack = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '娌℃湁姝ｅ湪鎾斁鐨勮建杩?);
      return;
    }
    
    if (!layerRef.value) {
      addLog('error', '鍦板浘缁勪欢鏈垵濮嬪寲');
      return;
    }
    
    // 灏濊瘯鍋滄鎵€鏈夎建杩规挱鏀?    let stopped = false;
    
    // 閬嶅巻鎵€鏈夎建杩瑰苟鍋滄鎾斁
    tracks.value.forEach(track => {
      try {
        const success = layerRef.value.stopTrack(track.id);
        if (success) stopped = true;
      } catch (e) {
        console.error(`鍋滄杞ㄨ抗 ${track.name} 澶辫触:`, e);
      }
    });
    
    if (stopped) {
      // 鍋滅敤杞ㄨ抗鎾斁鍣ㄥ伐鍏?      layerRef.value.deactivateTool('track-player');
      addLog('info', '宸插仠姝㈣建杩规挱鏀?);
    } else {
      addLog('warn', '娌℃湁姝ｅ湪鎾斁鐨勮建杩?);
    }
  } catch (e) {
    console.error('鍋滄杞ㄨ抗鎾斁澶辫触:', e);
    addLog('error', `鍋滄杞ㄨ抗鎾斁澶辫触: ${e}`);
  }
};

// 娓呴櫎鎵€鏈夎建杩?const clearAllTracks = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '娌℃湁杞ㄨ抗鍙竻闄?);
      return;
    }
    
    if (layerRef.value) {
      // 鍋滄鎵€鏈夎建杩规挱鏀?      tracks.value.forEach(track => {
        try {
          layerRef.value.stopTrack(track.id);
        } catch (e) {
          // 蹇界暐鍋滄澶辫触
        }
      });
      
      // 娓呴櫎鎵€鏈夎建杩?      const success = layerRef.value.clearAllTracks();
      
      if (success) {
        tracks.value = [];
        hasTrack.value = false;
        
        // 鍋滅敤杞ㄨ抗鎾斁鍣ㄥ伐鍏?        if (layerRef.value) {
          layerRef.value.deactivateTool('track-player');
        }
        
        addLog('info', '宸叉竻闄ゆ墍鏈夎建杩?);
      } else {
        addLog('error', '娓呴櫎杞ㄨ抗澶辫触');
      }
    } else {
      addLog('error', '鑾峰彇杞ㄨ抗瀵硅薄澶辫触');
    }
  } catch (e) {
    addLog('error', `娓呴櫎鎵€鏈夎建杩瑰け璐? ${e}`);
  }
};

// 鍒囨崲鎵€鏈夎建杩圭殑鍙鎬?const toggleTrackVisible = () => {
  try {
    if (!hasTrack.value || tracks.value.length === 0) {
      addLog('warn', '娌℃湁杞ㄨ抗鍙搷浣?);
      return;
    }
    
    if (layerRef.value) {
      if (allTracksVisible.value) {
        // 闅愯棌鎵€鏈夎建杩?        layerRef.value.hideAllTracks();
        allTracksVisible.value = false;
        addLog('info', '宸查殣钘忔墍鏈夎建杩?);
      } else {
        // 鏄剧ず鎵€鏈夎建杩?        layerRef.value.showAllTracks();
        allTracksVisible.value = true;
        addLog('info', '宸叉樉绀烘墍鏈夎建杩?);
      }
    } else {
      addLog('error', '鑾峰彇杞ㄨ抗瀵硅薄澶辫触');
    }
  } catch (e) {
    addLog('error', `鍒囨崲杞ㄨ抗鍙鎬уけ璐? ${e}`);
  }
};

// 鐢熸垚瀹氬悜杞ㄨ抗
const generateDirectionalTrack = (center: [number, number], direction: string, distance: number, points: nu
mber) => {
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 姣忕偣闂撮殧1鍒嗛挓
  const result = [];
  
  // 姣忕偣涔嬮棿鐨勮窛绂?  const step = distance / (points - 1);
  
  // 鏂瑰悜杞崲涓哄害鏁?  let dirDegrees = 0;
  let latMultiplier = 0;
  let lngMultiplier = 0;
  
  switch (direction) {
    case 'north':
      dirDegrees = 0;
      latMultiplier = 1;
      lngMultiplier = 0;
      break;
    case 'east':
      dirDegrees = 90;
      latMultiplier = 0;
      lngMultiplier = 1;
      break;
    case 'south':
      dirDegrees = 180;
      latMultiplier = -1;
      lngMultiplier = 0;
      break;
    case 'west':
      dirDegrees = 270;
      latMultiplier = 0;
      lngMultiplier = -1;
      break;
  }
  
  // 鐢熸垚杞ㄨ抗鐐?  for (let i = 0; i < points; i++) {
    const lat = center[0] + latMultiplier * i * step;
    const lng = center[1] + lngMultiplier * i * step;
    
    result.push({
      lat,
      lng,
      time: now + i * interval,
      dir: dirDegrees,
      title: `${getDirectionName(direction)}鍚戣建杩圭偣 ${i+1}`,
      info: [
        { key: '鏃堕棿', value: new Date((now + i * interval) * 1000).toLocaleTimeString() },
        { key: '閫熷害', value: '45 km/h' },
        { key: '鏂瑰悜', value: `${dirDegrees}掳` }
      ]
    });
  }
  
  return result;
};

// 鑾峰彇鏂瑰悜鍚嶇О
const getDirectionName = (direction: string) => {
  switch (direction) {
    case 'north': return '鍖?;
    case 'east': return '涓?;
    case 'south': return '鍗?;
    case 'west': return '瑗?;
    default: return direction;
  }
};

/**
 * 鍚敤鐑姏鍥? */
  if (!layerRef.value) return;
  if (result) {
    addLog('鐑姏鍥?, '鍚敤鐑姏鍥?);
  }
};

/**
 * 绂佺敤鐑姏鍥? */
  if (!layerRef.value) return;
  if (result) {
    addLog('鐑姏鍥?, '绂佺敤鐑姏鍥?);
  }
};

/**
 * 娣诲姞闅忔満鐑姏鐐? * @param count 鐑姏鐐规暟閲? */
  if (!layerRef.value) return;
  
  // 鍏堝惎鐢ㄧ儹鍔涘浘
  
  // 鑾峰彇鍦板浘涓績鐐?  const center = config.center;
  const points = [];
  
  // 鐢熸垚闅忔満鐑姏鐐?  for (let i = 0; i < count; i++) {
    // 鐢熸垚闅忔満缁忕含搴﹀亸绉?    const latOffset = Math.random() * 0.1 - 0.05;
    const lngOffset = Math.random() * 0.1 - 0.05;
    
    const point = {
      longitude: center[1] + lngOffset,
      latitude: center[0] + latOffset,
      weight: 0.4 + Math.random() * 0.6, // 0.4 - 1.0涔嬮棿鐨勯殢鏈烘潈閲?      name: `鐑姏鐐?${i+1}`,
      properties: {
        value: Math.floor(Math.random() * 100),
        type: '闅忔満鐐?
      }
    };
    
    points.push(point);
  }
  
  // 鎵归噺娣诲姞鐑姏鐐?  const ids = layerRef.value.addHeatmapPoints(points);
  const newPoints = points.map((p, i) => ({ ...p, id: ids[i] }));
  heatmapPoints.value = [...heatmapPoints.value, ...newPoints];
  
  // 濡傛灉娌℃湁閫変腑鐨勭儹鍔涚偣锛屽垯閫夋嫨绗竴涓?  if (!selectedHeatmapPoint.value && newPoints.length > 0) {
    selectedHeatmapPoint.value = newPoints[0].id;
    addLog('鐑姏鍥?, `宸查€変腑鐑姏鐐? ${newPoints[0].name}`);
  }
  
  addLog('鐑姏鍥?, `娣诲姞浜?{count}涓殢鏈虹儹鍔涚偣`);
};

/**
 * 娣诲姞鑱氱被鐑姏鐐? */
const addClusteredHeatmapPoints = () => {
  if (!layerRef.value) return;
  
  // 鍏堝惎鐢ㄧ儹鍔涘浘
  
  // 鑾峰彇鍦板浘涓績鐐?  const center = config.center;
  const clusters = 5; // 鑱氱被鏁伴噺
  const pointsPerCluster = 10; // 姣忎釜鑱氱被鐨勭偣鏁?  const points = [];
  
  // 鐢熸垚鑱氱被鐑姏鐐?  for (let c = 0; c < clusters; c++) {
    // 鑱氱被涓績鐐?    const clusterCenterLat = center[0] + (Math.random() * 0.2 - 0.1);
    const clusterCenterLng = center[1] + (Math.random() * 0.2 - 0.1);
    
    for (let i = 0; i < pointsPerCluster; i++) {
      // 鍦ㄨ仛绫讳腑蹇冨懆鍥寸敓鎴愮偣
      const latOffset = Math.random() * 0.02 - 0.01;
      const lngOffset = Math.random() * 0.02 - 0.01;
      
      const point = {
        longitude: clusterCenterLng + lngOffset,
        latitude: clusterCenterLat + latOffset,
        weight: 0.6 + Math.random() * 0.4, // 0.6 - 1.0涔嬮棿鐨勯殢鏈烘潈閲?        name: `鑱氱被 ${c+1} 鐑姏鐐?${i+1}`,
        properties: {
          cluster: c + 1,
          value: Math.floor(Math.random() * 100),
          type: '鑱氱被鐐?
        }
      };
      
      points.push(point);
    }
  }
  
  // 鎵归噺娣诲姞鐑姏鐐?  const ids = layerRef.value.addHeatmapPoints(points);
  heatmapPoints.value = [...heatmapPoints.value, ...points.map((p, i) => ({ ...p, id: ids[i] }))];
  
  addLog('鐑姏鍥?, `娣诲姞浜?{clusters}涓仛绫伙紝鍏?{clusters * pointsPerCluster}涓儹鍔涚偣`);
};

/**
 * 娣诲姞鏉冮噸鐑姏鐐? */
const addWeightedHeatmapPoints = () => {
  if (!layerRef.value) return;
  
  // 鍏堝惎鐢ㄧ儹鍔涘浘
  
  // 鑾峰彇鍦板浘涓績鐐?  const center = config.center;
  const points = [];
  
  // 鍒涘缓涓€涓潈閲嶉€掑鐨勭嚎鎬у垎甯?  for (let i = 0; i < 10; i++) {
    const weight = 0.1 + (i * 0.1); // 鏉冮噸浠?.1閫掑鍒?.0
    const latOffset = -0.05 + (i * 0.01);
    const lngOffset = 0;
    
    const point = {
      longitude: center[1] + lngOffset,
      latitude: center[0] + latOffset,
      weight: weight,
      name: `鏉冮噸${weight.toFixed(1)}鐨勭偣`,
      properties: {
        value: Math.round(weight * 100),
        type: '鏉冮噸鐐?
      }
    };
    
    points.push(point);
  }
  
  // 鎵归噺娣诲姞鐑姏鐐?  const ids = layerRef.value.addHeatmapPoints(points);
  heatmapPoints.value = [...heatmapPoints.value, ...points.map((p, i) => ({ ...p, id: ids[i] }))];
  
  addLog('鐑姏鍥?, '娣诲姞浜?0涓潈閲嶉€掑鐨勭儹鍔涚偣');
};

/**
 * 娓呴櫎鐑姏鍥? */
const clearHeatmap = () => {
  if (!layerRef.value) return;
  
  const result = layerRef.value.clearHeatmap();
  if (result) {
    heatmapPoints.value = [];
    addLog('鐑姏鍥?, '娓呴櫎鐑姏鍥剧偣');
  }
};

/**
 * 閰嶇疆鐑姏鍥炬牱寮? */
  if (!layerRef.value) return;
  
  // 璁剧疆鐑姏鍥鹃厤缃?  const heatmapConfig = {
    radius: 20,                // 鐑姏鐐瑰崐寰?    blur: 15,                  // 妯＄硦澶у皬
    opacity: 0.8,              // 涓嶉€忔槑搴?    gradient: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff000
0'], // 娓愬彉鑹?    showPoints: pointsVisible.value,  // 鏄剧ず鏁版嵁鐐?    pointRadius: 4,            // 鐐瑰崐寰?    po
intColor: 'rgba(0, 0, 255, 0.7)' // 鐐归鑹?  };
  
  if (result) {
    addLog('鐑姏鍥?, '鏇存柊鐑姏鍥鹃厤缃?);
  }
};

/**
 * 鍒囨崲鏄惁鏄剧ず鏁版嵁鐐? */
const togglePointsVisible = () => {
  if (!layerRef.value) return;
  
  pointsVisible.value = !pointsVisible.value;
  
    showPoints: pointsVisible.value
  });
  
  addLog('鐑姏鍥?, pointsVisible.value ? '鏄剧ず鏁版嵁鐐? : '闅愯棌鏁版嵁鐐?);
};

// 宸ュ叿鏍忎綅缃?const toolbarPosition = ref<ToolbarPosition>(ToolbarPosition.TOP_LEFT);

// 绠€鍖栧伐鍏锋爮浣嶇疆鏇存柊鏂规硶
const changeToolbarPosition = (position: ToolbarPosition) => {
  toolbarPosition.value = position;
  
  if (!layerRef.value) return;
  
  // 鏇存柊宸ュ叿鏍忎綅缃厤缃?  layerRef.value.updateToolbarConfig({ position });
  
  // 璁板綍鏃ュ織
  addLog('宸ュ叿鏍?, `鍒囨崲浣嶇疆: ${position}`);
};

// 娣诲姞宸ュ叿鏍忔柟鍚戞暟鎹?const toolbarDirection = ref<ToolbarDirection>(ToolbarDirection.HORIZONTAL);

// 绠€鍖栧伐鍏锋爮鏂瑰悜鏇存柊鏂规硶
const changeToolbarDirection = (direction: ToolbarDirection) => {
  toolbarDirection.value = direction;
  
  if (!layerRef.value) return;
  
  // 鏇存柊宸ュ叿鏍忔柟鍚戦厤缃?  layerRef.value.updateToolbarConfig({ direction });
  
  // 璁板綍鏃ュ織
  addLog('宸ュ叿鏍?, `鍒囨崲鏂瑰悜: ${direction}`);
};

/**
 * 鍚敤椋炵嚎鍥? */
const enableFlightLine = async () => {
  if (!layerRef.value) return;
  
  try {
    // 鑾峰彇椋炵嚎鍥惧璞?    const flightLineObj = layerRef.value.getFlightLineObject();
    if (!flightLineObj) {
      addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
      return;
    }
    
    // 鍚敤椋炵嚎鍥?    await flightLineObj.enable();
    flightLineActive.value = true;
    addLog('椋炵嚎鍥?, '椋炵嚎鍥惧凡鍚敤');
    
    // 娣诲姞娴嬭瘯椋炵嚎
    if (process.env.NODE_ENV === 'development') {
      addTestFlightLines();
    }
    
    // 鏇存柊椋炵嚎鍒楄〃
    setTimeout(() => {
      updateFlightLineList();
    }, 300);
  } catch (error) {
    console.error('鍚敤椋炵嚎鍥惧け璐?', error);
    addLog('椋炵嚎鍥?, `鍚敤椋炵嚎鍥惧け璐? ${error.message}`);
  }
};

/**
 * 绂佺敤椋炵嚎鍥? */
const disableFlightLine = () => {
  if (!layerRef.value) return;
  
  // 灏濊瘯鍋滅敤椋炵嚎鍥惧伐鍏?  const result = layerRef.value.deactivateTool('flightLine');
  
  if (result) {
    flightLineActive.value = false;
    
    // 娓呯┖椋炵嚎鍒楄〃
    flightLines.value = [];
    selectedFlightLine.value = null; // 淇敼涓哄崟閫夊彉閲?    
    addLog('椋炵嚎鍥?, '绂佺敤椋炵嚎鍥?);
  } else {
    addLog('椋炵嚎鍥?, '绂佺敤椋炵嚎鍥惧け璐ワ紝璇风‘璁ら绾垮浘宸ュ叿宸叉縺娲?);
  }
};

/**
 * 鏇存柊椋炵嚎鍒楄〃
 */
const updateFlightLineList = () => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  try {
    // 鑾峰彇鎵€鏈夐绾挎暟鎹?    const allFlightLines = flightLineObj.getAllFlightLines();
    if (!allFlightLines) {
      flightLines.value = [];
      selectedFlightLine.value = null;
      return;
    }
    
    // 杞崲Map涓烘暟缁勫苟鎸夊垱寤烘椂闂存帓搴?    const linesArray: Array<FlightLineData & { id: string }> = [];
    allFlightLines.forEach((line, id) => {
      linesArray.push({
        ...line,
        id
      });
    });
    
    // 鎸夊垱寤烘椂闂村€掑簭鎺掑簭锛屾渶鏂扮殑鍦ㄥ墠闈?    linesArray.sort((a, b) => {
      const timeA = a._createTime || 0;
      const timeB = b._createTime || 0;
      return timeB - timeA;
    });
    
    // 鏇存柊鍒楄〃
    flightLines.value = linesArray;
    
    // 鑾峰彇褰撳墠婵€娲荤殑椋炵嚎
    const activeFlightLine = flightLineObj.getActiveFlightLine();
    
    // 鏇存柊閫変腑鐘舵€?    selectedFlightLine.value = activeFlightLine;
    
    addLog('椋炵嚎鍥?, `椋炵嚎鍒楄〃宸叉洿鏂帮紝鍏?${linesArray.length} 鏉￠绾縛);
  } catch (error) {
    console.error('鑾峰彇椋炵嚎鍒楄〃閿欒:', error);
    addLog('椋炵嚎鍥?, `鑾峰彇椋炵嚎鍒楄〃澶辫触: ${error.message}`);
  }
};

/**
 * 閫夋嫨椋炵嚎
 * @param id 椋炵嚎ID
 */
const selectFlightLine = (id: string) => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 濡傛灉褰撳墠閫変腑鐨勫氨鏄繖涓狪D锛屽垯鍙栨秷閫変腑
  if (selectedFlightLine.value === id) {
    // 鍙栨秷閫変腑褰撳墠椋炵嚎
    flightLineObj.updateFlightLine(id, {
      highlight: false,
      style: undefined
    });
    selectedFlightLine.value = null;
    
    // 鑾峰彇椋炵嚎鏁版嵁璁板綍鏃ュ織
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('椋炵嚎鍥?, `鍙栨秷閫変腑椋炵嚎: ${line.fromName} -> ${line.toName}`);
    }
  } else {
    // 璁剧疆鏂伴€変腑鐨勯绾?    flightLineObj.setActiveFlightLine(id);
    selectedFlightLine.value = id;
    
    // 鑾峰彇椋炵嚎鏁版嵁璁板綍鏃ュ織
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('椋炵嚎鍥?, `閫変腑椋炵嚎: ${line.fromName} -> ${line.toName}`);
    }
  }
};

// 妫€鏌ラ绾挎槸鍚﹁閫変腑
const isFlightLineSelected = (id: string) => {
  return selectedFlightLine.value === id;
};

// 鑾峰彇鍒嗙粍涓殑鏍囪鐐规暟閲?function getGroupMarkerCount(groupName: string): number {
  return markers.value.filter(marker => marker.group === groupName).length;
}

// 鍒囨崲鍒嗙粍鍙鎬?function toggleMarkerGroupVisibility(groupName: string) {
  if (!layerRef.value) return;
  
  // 鎵惧埌鍒嗙粍淇℃伅
  const groupInfo = markerGroups.value.find(g => g.name === groupName);
  if (!groupInfo) return;
  
  if (groupInfo.visible) {
    // 濡傛灉褰撳墠鍙锛屽垯闅愯棌
    layerRef.value.hideMarkerGroup(groupName);
    groupInfo.visible = false;
    addLog('鎿嶄綔', `宸查殣钘?"${groupName}" 鍒嗙粍鐨勬爣璁扮偣`);
  } else {
    // 濡傛灉褰撳墠闅愯棌锛屽垯鏄剧ず
    layerRef.value.showMarkerGroup(groupName);
    groupInfo.visible = true;
    addLog('鎿嶄綔', `宸叉樉绀?"${groupName}" 鍒嗙粍鐨勬爣璁扮偣`);
  }
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
}

// 寰幆鍒囨崲涓嶅悓鍒嗙粍鐨勫彲瑙佹€?function toggleGroupVisibility() {
  if (!layerRef.value || markerGroups.value.length === 0) {
    ElMessage.warning('娌℃湁鍙敤鐨勬爣璁扮偣鍒嗙粍');
    return;
  }
  
  // 纭繚绱㈠紩鍦ㄦ湁鏁堣寖鍥村唴
  if (currentGroupIndex.value >= markerGroups.value.length) {
    currentGroupIndex.value = 0;
  }
  
  // 鑾峰彇褰撳墠鍒嗙粍
  const currentGroup = markerGroups.value[currentGroupIndex.value];
  
  // 鍒囨崲褰撳墠鍒嗙粍鐨勫彲瑙佹€?  toggleMarkerGroupVisibility(currentGroup.name);
  
  // 鏇存柊绱㈠紩涓轰笅涓€涓垎缁?  currentGroupIndex.value = (currentGroupIndex.value + 1) % markerGroups.value.length;
}

// 娣诲姞鍒嗙粍鏍囪鐐?function addGroupedMarkers() {
  if (!layerRef.value) return;
  
  // 瀹氫箟鍒嗙粍
  const groups = ['鏅偣', '椁愬巺', '浜ら€?, '璐墿'];
  
  // 涓烘瘡涓垎缁勬坊鍔?涓爣璁扮偣
  groups.forEach(groupName => {
    for (let i = 0; i < 3; i++) {
      const centerLon = config.center[1];
      const centerLat = config.center[0];
      
      // 鏍规嵁鍒嗙粍绋嶅井璋冩暣浣嶇疆锛岄伩鍏嶉噸鍙?      let offsetMultiplier = 0;
      switch(groupName) {
        case '鏅偣': offsetMultiplier = 1; break;
        case '椁愬巺': offsetMultiplier = -1; break;
        case '浜ら€?: offsetMultiplier = 0.5; break;
        case '璐墿': offsetMultiplier = -0.5; break;
      }
      
      const offsetLon = (Math.random() - 0.5) * 0.05 + offsetMultiplier * 0.01;
      const offsetLat = (Math.random() - 0.5) * 0.05 + offsetMultiplier * 0.01;
      
      const lon = centerLon + offsetLon;
      const lat = centerLat + offsetLat;
      
      const id = `marker-${groupName}-${Date.now()}-${i}`;
      
      // 鏍规嵁鍒嗙粍璁剧疆涓嶅悓棰滆壊鍜屽浘鏍?      let color;
      switch(groupName) {
        case '鏅偣': color = '#1890ff'; break; // 钃濊壊
        case '椁愬巺': color = '#52c41a'; break; // 缁胯壊
        case '浜ら€?: color = '#faad14'; break; // 姗欒壊
        case '璐墿': color = '#722ed1'; break; // 绱壊
      }
      
      // 鍒涘缓SVG鍥炬爣
      const iconSvg = `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org
/2000/svg"><path d="M12 0C28 0 24 24 12 36C0 24 -4 0 12 0Z" fill="${color}"/><circle cx="12" cy="12" r="6" 
fill="white"/></svg>`;
      
      layerRef.value.addMarker({
        id,
        position: [lon, lat],
        title: `${groupName}鏍囪 ${i + 1}`,
        icon: iconSvg,
        iconType: 'svg',
        clickable: true,
        usePopover: true,
        group: groupName, // 璁剧疆鍒嗙粍灞炴€?        data: { type: 'grouped', index: i }
      });
    }
  });
  
  // 鏇存柊鏍囪鐐瑰垪琛?  updateMarkerList();
  // 鏇存柊鍒嗙粍鍒楄〃
  updateMarkerGroups();
  
  addLog('鎿嶄綔', '宸叉坊鍔?涓垎缁勭殑鏍囪鐐癸紝姣忕粍3涓?);
}

// 鏇存柊鍒嗙粍鍒楄〃
function updateMarkerGroups() {
  if (!layerRef.value) return;
  
  // 鑾峰彇鎵€鏈夊垎缁?  const groups = layerRef.value.getGroups();
  markerGroups.value = groups;
  
  addLog('鏇存柊', `鑾峰彇鍒?${groups.length} 涓爣璁扮偣鍒嗙粍`);
}

// 鍒囨崲鍦板浘绫诲瀷
const changeMapType = (mapType: MapType) => {
  config.mapType = mapType;
  handleMapTypeChange();
};

// 鍒囨崲鍥惧眰绫诲瀷
const changeLayerType = (layerType: string) => {
  tileType.value = layerType;
  handleLayerTypeChange();
};

// 娣诲姞鏍囪鐐硅仛鍚堟ā寮忕殑鏋氫妇
const MarkerClusterMode = {
  CLUSTER: 'cluster',
  NONE: 'none'
};

/**
 * 娣诲姞闅忔満椋炵嚎
 */
const addRandomFlightLines = () => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 寮哄埗鍚敤椋炵嚎鍥?  flightLineObj.enable().then(() => {
    try {
      // 鑾峰彇鍦板浘涓績鐐?      const center = config.center;
      const centerLon = center[1];
      const centerLat = center[0];
      
      addLog('椋炵嚎鍥?, `鍦板浘涓績鐐? [${centerLat}, ${centerLon}]`);
      
      // 鍒涘缓鍧愭爣鏄犲皠琛?- 鍙傝€僺akitam.com绀轰緥
      const geoCoordMap = {
        '涓績鐐?: [centerLon, centerLat]
      };
      
      // 鍒涘缓鍥涗釜涓昏鏂瑰悜鐐?      const directions = ['涓?, '鍗?, '瑗?, '鍖?];
      const offsets = [
        [0.05, 0],    // 涓?        [0, -0.05],   // 鍗?        [-0.05, 0],   // 瑗?        [0, 0.05]     // 鍖
?      ];
      
      // 娣诲姞鍥涗釜鍥哄畾鏂瑰悜鐐?      for (let i = 0; i < 4; i++) {
        const name = `${directions[i]}鏂瑰悜`;
        const lon = centerLon + offsets[i][0];
        const lat = centerLat + offsets[i][1];
        geoCoordMap[name] = [lon, lat];
      }
      
      // 娣诲姞涓€浜涢殢鏈虹偣
      for (let i = 0; i < 6; i++) {
        const name = `闅忔満鐐?{i+1}`;
        const lon = centerLon + (Math.random() - 0.5) * 0.1;
        const lat = centerLat + (Math.random() - 0.5) * 0.1;
        geoCoordMap[name] = [lon, lat];
      }
      
      // 灏嗘墍鏈夊潗鏍囩偣娣诲姞鍒伴绾垮璞′腑
      flightLineObj.addCoordinates(geoCoordMap);
      
      // 鍒涘缓浠庝腑蹇冪偣鍑哄彂鐨勬暟鎹?      const centerData = [
        [{ name: '涓績鐐? }, { name: '涓滄柟鍚?, value: 95 }],
        [{ name: '涓績鐐? }, { name: '鍗楁柟鍚?, value: 85 }],
        [{ name: '涓績鐐? }, { name: '瑗挎柟鍚?, value: 75 }],
        [{ name: '涓績鐐? }, { name: '鍖楁柟鍚?, value: 65 }]
      ];
      
      // 鍒涘缓浠庝笢鏂瑰悜鍑哄彂鐨勬暟鎹?      const eastData = [
        [{ name: '涓滄柟鍚? }, { name: '闅忔満鐐?', value: 90 }],
        [{ name: '涓滄柟鍚? }, { name: '闅忔満鐐?', value: 80 }]
      ];
      
      // 鍒涘缓浠庡崡鏂瑰悜鍑哄彂鐨勬暟鎹?      const southData = [
        [{ name: '鍗楁柟鍚? }, { name: '闅忔満鐐?', value: 85 }],
        [{ name: '鍗楁柟鍚? }, { name: '闅忔満鐐?', value: 75 }]
      ];
      
      // 杞崲鏁版嵁涓洪绾挎暟鎹?      const convertData = (data) => {
        const res = [];
        for (let i = 0; i < data.length; i++) {
          const dataItem = data[i];
          const fromCoord = geoCoordMap[dataItem[0].name];
          const toCoord = geoCoordMap[dataItem[1].name];
          if (fromCoord && toCoord) {
            res.push({
              fromName: dataItem[0].name,
              toName: dataItem[1].name,
              coords: [fromCoord, toCoord],
              value: dataItem[1].value
            });
          }
        }
        return res;
      };
      
      // 杞崲鏁版嵁
      const lines = [
        ...convertData(centerData),
        ...convertData(eastData),
        ...convertData(southData)
      ];
      
      // 涓烘瘡鏉＄嚎娣诲姞鏍峰紡
      const colors = ['#a6c84c', '#ffa022', '#46bee9'];
      lines.forEach((line, index) => {
        const colorIndex = index % colors.length;
        line.style = {
          color: colors[colorIndex],
          width: 1,
          opacity: 0.5,
          curveness: 0.2
        };
      });
      
      // 娣诲姞椋炵嚎
      const ids = flightLineObj.addFlightLines(lines, true, 6);
      
      // 璁剧疆鏈€浣宠瑙?      setTimeout(() => {
        flightLineObj.setOptimalView(6);
      }, 300);
      
      // 鏇存柊椋炵嚎鍒楄〃
      setTimeout(() => {
        updateFlightLineList();
      }, 500);
      
      addLog('椋炵嚎鍥?, `宸叉坊鍔?{lines.length}鏉￠绾匡紝璇风瓑寰呮樉绀篳);
    } catch (error) {
      console.error('娣诲姞椋炵嚎鏃跺彂鐢熼敊璇?', error);
      addLog('椋炵嚎鍥?, `娣诲姞椋炵嚎鏃跺彂鐢熼敊璇? ${error.message || error}`);
    }
  }).catch(err => {
    console.error('鍚敤椋炵嚎鍥惧け璐?', err);
    addLog('椋炵嚎鍥?, `鍚敤椋炵嚎鍥惧け璐? ${err.message || err}`);
  });
};

/**
 * 娣诲姞閾剧姸椋炵嚎
 */
const addChainFlightLines = () => {
  if (!layerRef.value) return;
  
  // 鍏堝惎鐢ㄩ绾垮浘
  if (!flightLineActive.value) {
    enableFlightLine();
  }
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 鑾峰彇鍦板浘涓績鐐?  const center = config.center;
  const centerLon = center[1];
  const centerLat = center[0];
  
  // 鍒涘缓閾剧姸椋炵嚎鏁版嵁
  const nodeCount = 6;
  const lines = [];
  const points = [];
  
  // 鍏堝垱寤轰竴绯诲垪鐐癸紝褰㈡垚閾剧姸缁撴瀯
  for (let i = 0; i < nodeCount; i++) {
    // 浣跨偣娌挎按骞崇嚎鍒嗗竷
    const lat = centerLat;
    const lon = centerLon - 0.1 + (i * 0.2 / (nodeCount - 1));
    
    points.push({
      name: `鑺傜偣${i+1}`,
      coords: [lon, lat]
    });
  }
  
  // 鍒涘缓鐩搁偦鐐逛箣闂寸殑椋炵嚎杩炴帴
  for (let i = 0; i < nodeCount - 1; i++) {
    lines.push({
      fromName: points[i].name,
      toName: points[i+1].name,
      coords: [
        points[i].coords,
        points[i+1].coords
      ],
      value: 50
    });
  }
  
  // 娣诲姞椋炵嚎
  flightLineObj.addFlightLines(lines);
  
  // 鏇存柊椋炵嚎鍒楄〃
  updateFlightLineList();
  
  addLog('椋炵嚎鍥?, `宸叉坊鍔?{lines.length}鏉￠摼鐘堕绾縛);
};

/**
 * 娣诲姞鏄熷瀷椋炵嚎
 */
const addStarFlightLines = () => {
  if (!layerRef.value) return;
  
  // 鍏堝惎鐢ㄩ绾垮浘
  if (!flightLineActive.value) {
    enableFlightLine();
  }
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 鑾峰彇鍦板浘涓績鐐?  const center = config.center;
  const centerLon = center[1];
  const centerLat = center[0];
  
  // 鍒涘缓鏄熷瀷椋炵嚎鏁版嵁
  const nodeCount = 8; // 澶栧洿鑺傜偣鏁伴噺
  const lines = [];
  
  // 鍒涘缓涓績鐐?  const centerName = "涓績鐐?;
  
  // 鍒涘缓鍛ㄥ洿鐨勭偣锛屽舰鎴愭槦鍨嬬粨鏋?  for (let i = 0; i < nodeCount; i++) {
    // 璁＄畻瑙掑害锛屼娇鑺傜偣鍧囧寑鍒嗗竷鍦ㄥ渾鍛ㄤ笂
    const angle = (i / nodeCount) * Math.PI * 2;
    const radius = 0.05; // 鍗婂緞
    
    // 璁＄畻鍧愭爣
    const lat = centerLat + Math.sin(angle) * radius;
    const lon = centerLon + Math.cos(angle) * radius;
    
    const name = `鑺傜偣${i+1}`;
    
    // 娣诲姞浠庝腑蹇冪偣鍒板鍥磋妭鐐圭殑杩炵嚎
    lines.push({
      fromName: centerName,
      toName: name,
      coords: [
        [centerLon, centerLat],
        [lon, lat]
      ],
      value: 70
    });
  }
  
  // 娣诲姞椋炵嚎
  flightLineObj.addFlightLines(lines);
  
  // 鏇存柊椋炵嚎鍒楄〃
  updateFlightLineList();
  
  addLog('椋炵嚎鍥?, `宸叉坊鍔?{lines.length}鏉℃槦鍨嬮绾縛);
};

/**
 * 鏇存柊椋炵嚎鍥鹃厤缃? */
const updateFlightLineConfig = () => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 鏇存柊椋炵嚎鍥鹃厤缃?  flightLineObj.setConfig(flightLineConfig.value);
  
  addLog('椋炵嚎鍥?, '鏇存柊椋炵嚎鍥鹃厤缃?);
};

/**
 * 娓呴櫎椋炵嚎
 */
const clearFlightLines = () => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 娓呴櫎椋炵嚎
  try {
    // 绉婚櫎鎵€鏈夐绾?    const allFlightLines = flightLineObj.getAllFlightLines();
    if (allFlightLines && allFlightLines.size > 0) {
      // 閫愪釜鍒犻櫎椋炵嚎
      allFlightLines.forEach((line, id) => {
        try {
          flightLineObj.removeFlightLine(id);
        } catch (e) {
          console.error(`鍒犻櫎椋炵嚎 ${id} 澶辫触:`, e);
        }
      });
    }
    
    // 鏇存柊椋炵嚎鍒楄〃
    flightLines.value = [];
    selectedFlightLine.value = null;
    
    addLog('椋炵嚎鍥?, '宸叉竻闄ゆ墍鏈夐绾?);
  } catch (error) {
    console.error('娓呴櫎椋炵嚎澶辫触:', error);
    addLog('椋炵嚎鍥?, `娓呴櫎椋炵嚎澶辫触: ${error.message}`);
  }
};

/**
 * 鍒囨崲鐑姏鍥炬€ц兘妯″紡
 */
const toggleHeatmapPerformanceMode = () => {
  if (!layerRef.value) return;
  
  // 鑾峰彇鐑姏鍥惧璞?  const heatmapObj = layerRef.value.getHeatmapObject();
  if (!heatmapObj) {
    addLog('鐑姏鍥?, '鏃犳硶鑾峰彇鐑姏鍥惧璞?);
    return;
  }
  
  // 鍒囨崲鎬ц兘妯″紡
  heatmapPerformanceMode.value = !heatmapPerformanceMode.value;
  
  // 璁剧疆鐑姏鍥炬€ц兘妯″紡
  heatmapObj.setPerformanceMode(heatmapPerformanceMode.value);
  
  // 璁板綍鏃ュ織
  addLog('鐑姏鍥?, `鎬ц兘妯″紡宸?{heatmapPerformanceMode.value ? '鍚敤' : '绂佺敤'}`);
};

// 鏄剧ず鍏ㄩ儴椋炵嚎
const showAllFlightLines = () => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 鑾峰彇鎵€鏈夐绾挎暟鎹?  const allFlightLines = flightLineObj.getAllFlightLines();
  if (!allFlightLines) {
    flightLines.value = [];
    selectedFlightLine.value = null;
    return;
  }
  
  // 杞崲Map涓烘暟缁?  const linesArray: Array<FlightLineData & { id: string }> = [];
  allFlightLines.forEach((line, id) => {
    linesArray.push({
      ...line,
      id
    });
  });
  
  // 鏇存柊鍒楄〃
  flightLines.value = linesArray;
  
  // 鑾峰彇褰撳墠婵€娲荤殑椋炵嚎
  const activeFlightLine = flightLineObj.getActiveFlightLine();
  
  // 鏇存柊閫変腑鐘舵€?  selectedFlightLine.value = activeFlightLine;
  
  // 璁板綍鎿嶄綔
  if (linesArray.length > 0) {
    addLog('椋炵嚎鍥?, `宸叉洿鏂伴绾垮垪琛紝鍏?${linesArray.length} 鏉￠绾縛);
  }
};

// 閫夋嫨鍗曟潯椋炵嚎
const selectSingleFlightLine = (id: string) => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 濡傛灉褰撳墠閫変腑鐨勫氨鏄繖涓狪D锛屽垯鍒囨崲鍒版樉绀哄叏閮?  if (selectedFlightLine.value === id) {
    // 鏄剧ず鎵€鏈夐绾?    flightLineObj.showAllFlightLines();
    selectedFlightLine.value = null;
    
    // 鑾峰彇椋炵嚎鏁版嵁璁板綍鏃ュ織
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('椋炵嚎鍥?, `鍙栨秷鍗曢绾挎樉绀猴紝鎭㈠鏄剧ず鍏ㄩ儴`);
    }
  } else {
    // 鍙樉绀洪€変腑鐨勯绾?    flightLineObj.showOnlyFlightLine(id);
    selectedFlightLine.value = id;
    
    // 鑾峰彇椋炵嚎鏁版嵁璁板綍鏃ュ織
    const line = flightLines.value.find(line => line.id === id);
    if (line) {
      addLog('椋炵嚎鍥?, `鍙樉绀洪绾? ${line.fromName} -> ${line.toName}`);
    }
  }
};

/**
 * 鍦板浘鍒濆鍖栧畬鎴? */
const onMapInitialized = (map: any) => {
  addLog('鍦板浘', '鍦板浘鍒濆鍖栧畬鎴?);
  
  // 鍚敤椋炵嚎鍥?  enableFlightLine();
  
  // 鏇存柊椋炵嚎鍒楄〃
  setTimeout(() => {
    updateFlightLineList();
  }, 500);
};

/**
 * 娣诲姞娴嬭瘯椋炵嚎鏁版嵁
 */
const addTestFlightLines = () => {
  if (!layerRef.value) return;
  
  // 鑾峰彇椋炵嚎鍥惧璞?  const flightLineObj = layerRef.value.getFlightLineObject();
  if (!flightLineObj) {
    addLog('椋炵嚎鍥?, '鏃犳硶鑾峰彇椋炵嚎鍥惧璞?);
    return;
  }
  
  // 绀轰緥鍩庡競鍧愭爣
  const cities = {
    '鍖椾含': [116.4, 39.9],
    '涓婃捣': [121.5, 31.2],
    '骞垮窞': [113.3, 23.1],
    '娣卞湷': [114.1, 22.5],
    '鏉窞': [120.2, 30.3],
    '鎴愰兘': [104.1, 30.7],
    '姝︽眽': [114.3, 30.6],
    '瑗垮畨': [108.9, 34.3],
    '鍗椾含': [118.8, 32.0],
    '閲嶅簡': [106.5, 29.5]
  };
  
  // 娣诲姞鍧愭爣鐐?  flightLineObj.addCoordinates(cities as any);
  
  // 鍒涘缓杩炴帴鎵€鏈夊煄甯傜殑椋炵嚎缃戠粶锛屼互鍖椾含涓轰腑蹇?  const cityNames = Object.keys(cities);
  const testLines = [];
  
  // 鍒涘缓浠ュ寳浜负涓績鐨勬槦褰㈢綉缁?  for (let i = 1; i < cityNames.length; i++) {
    const from = '鍖椾含';
    const to = cityNames[i];
    testLines.push({
      fromName: from,
      toName: to,
      coords: [cities[from], cities[to]],
      value: Math.floor(Math.random() * 1000) + 100
    });
  }
  
  // 娣诲姞娴嬭瘯椋炵嚎
  flightLineObj.addFlightLines(testLines);
  
  addLog('椋炵嚎鍥?, `娣诲姞浜?{testLines.length}鏉℃祴璇曢绾縛);
};

/**
 * 缁樺埗鍙板窞杈圭晫
 */
const drawTaizhouBoundary = () => {
  if (!layerRef.value) return;
  
  addLog('鎿嶄綔', '寮€濮嬬粯鍒跺彴宸炶竟鐣?);
  
  // 鍙板窞甯傝竟鐣孏eoJSON鏁版嵁 (绠€鍖栫増鍧愭爣)
  const taizhouBoundaryData = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "鍙板窞甯?,
          "id": "331000",
          "cp": [121.42079, 28.655716],
          "childNum": 9
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [121.25183, 28.34585],
              [121.10168, 28.39856],
              [121.01562, 28.35297],
              [120.89355, 28.36189],
              [120.83862, 28.32241],
              [120.75256, 28.35297],
              [120.68115, 28.28024],
              [120.55359, 28.30966],
              [120.47852, 28.41366],
              [120.42358, 28.38077],
              [120.33203, 28.41098],
              [120.22644, 28.51578],
              [120.18799, 28.61237],
              [120.10193, 28.63289],
              [120.00488, 28.75915],
              [119.87183, 28.80852],
              [119.81689, 28.89682],
              [119.84436, 28.99861],
              [119.80591, 29.11122],
              [119.73999, 29.13695],
              [119.68506, 29.25199],
              [119.60449, 29.31404],
              [119.62097, 29.37159],
              [119.57153, 29.43986],
              [119.60999, 29.56245],
              [119.68506, 29.59875],
              [119.77112, 29.58347],
              [119.89319, 29.63828],
              [119.96460, 29.61777],
              [120.07019, 29.66443],
              [120.12512, 29.65181],
              [120.20020, 29.68259],
              [120.34485, 29.65443],
              [120.44189, 29.68259],
              [120.55847, 29.64180],
              [120.62988, 29.55766],
              [120.69580, 29.53970],
              [120.83496, 29.57079],
              [120.93750, 29.58347],
              [121.01257, 29.54760],
              [121.11511, 29.56530],
              [121.16455, 29.61777],
              [121.29211, 29.59036],
              [121.32507, 29.51934],
              [121.47522, 29.45004],
              [121.52466, 29.36679],
              [121.57959, 29.38721],
              [121.69067, 29.32686],
              [121.74011, 29.25199],
              [121.78955, 29.16644],
              [121.84448, 29.10164],
              [121.98914, 28.99592],
              [122.11121, 28.92111],
              [122.15515, 28.84060],
              [122.11121, 28.75377],
              [122.04529, 28.72253],
              [121.96472, 28.71171],
              [121.90430, 28.66504],
              [121.87683, 28.60480],
              [121.88232, 28.52933],
              [121.96472, 28.45234],
              [121.89880, 28.41635],
              [121.83838, 28.46588],
              [121.74683, 28.42527],
              [121.72485, 28.35297],
              [121.66992, 28.32510],
              [121.48681, 28.33673],
              [121.36475, 28.36189],
              [121.25183, 28.34585]
            ]
          ]
        }
      }
    ]
  };
  
  try {
    // 鎻愬彇澶氳竟褰㈠潗鏍?    const coordinates = taizhouBoundaryData.features[0].geometry.coordinates[0];
    
    // 杞崲鎴愰€傚悎ScLayer鐨勬牸寮?- 灏哰lon, lat]鏍煎紡杞负[lat, lon]鏍煎紡
    const taizhouCoordinates = coordinates.map(point => [point[1], point[0]]);
    
    // 浣跨敤addPolygon鏂规硶缁樺埗鍙板窞杈圭晫
    const id = layerRef.value.addPolygon(taizhouCoordinates, {
      name: '鍙板窞甯傝竟鐣?,
      data: { regionId: '331000', regionType: 'city' },
      fillColor: 'rgba(24, 144, 255, 0.3)',
      strokeColor: 'rgba(24, 144, 255, 0.8)',
      strokeWidth: 3,
      dashArray: '5,5',
      fillOpacity: 0.4
    });
    
    // 鏇存柊鍥惧舰鍒楄〃
    updateShapeList();
    
    // 璁剧疆鍦板浘瑙嗚鍒板彴宸炰腑蹇?    layerRef.value.getMapObject().setView([28.655716, 121.42079] as [number, number
], 9);
    
    addLog('杈圭晫', `宸茬粯鍒跺彴宸炲競杈圭晫 [ID: ${safeSlice(id)}]`);
  } catch (error) {
    console.error('缁樺埗鍙板窞杈圭晫澶辫触:', error);
    addLog('閿欒', `缁樺埗鍙板窞杈圭晫澶辫触: ${error.message}`);
  }
};

// 閫夋嫨杞ㄨ抗
const selectTrack = (trackId: string) => {
  // 濡傛灉閫変腑鐨勬槸褰撳墠宸查€変腑鐨勮建杩癸紝鍒欏彇娑堥€変腑
  if (activeTrackId.value === trackId) {
    activeTrackId.value = null;
  } else {
    activeTrackId.value = trackId;
  }
  
  addLog('杞ㄨ抗', `閫変腑杞ㄨ抗: ${trackId}`);
};

// 鍙屽嚮瀹氫綅鍒拌建杩?const locateTrack = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '鍦板浘缁勪欢鏈垵濮嬪寲');
    return;
  }
  
  // 浣跨敤fitTrackToView鏂规硶瀹氫綅鍒拌建杩?  const success = layerRef.value.fitTrackToView(trackId, {
    gotoStart: true,
    padding: [100, 100, 100, 100],
    duration: 600,
    maxZoom: 16
  });
  
  if (success) {
    addLog('杞ㄨ抗', `宸插畾浣嶅埌杞ㄨ抗: ${trackId}`);
    // 鑷姩閫変腑杞ㄨ抗
    activeTrackId.value = trackId;
  } else {
    addLog('error', `瀹氫綅杞ㄨ抗澶辫触: ${trackId}`);
  }
};

// 鎾斁鎸囧畾ID鐨勮建杩?const playTrackById = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '鍦板浘缁勪欢鏈垵濮嬪寲');
    return;
  }
  
  // 浣跨敤閰嶇疆鍙橀噺璁剧疆鎾斁鍙傛暟
  const success = layerRef.value.playTrack(trackId, {
    loop: trackPlayLoop.value,
    speed: trackPlaySpeed.value,
    withCamera: trackPlayWithCamera.value,
    speedFactor: 1.0,
    showNodes: trackPlayShowNodes.value,
    showNodeAnchors: true,
    showNodeNames: true,  // 鏄剧ず鑺傜偣鍚嶇О
    showNodeTime: true,   // 鏄剧ず鑺傜偣鏃堕棿
    showPointNames: true, // 鏄剧ず绉诲姩鐐逛綅鍚嶇О
    showSpeed: true,      // 鏄剧ず閫熷害
    showNodeSpeed: true   // 鏄剧ず鑺傜偣閫熷害
  });
  
  if (success) {
    // 灏濊瘯婵€娲昏建杩规挱鏀惧櫒宸ュ叿
    layerRef.value.activateTool('track-player');
    
    // 鑾峰彇鍦板浘瀵硅薄骞惰Е鍙戞覆鏌?    const map = layerRef.value.getMapObject();
    if (map) {
      map.render();
      
      // 鍐嶆瑙﹀彂娓叉煋浠ョ‘淇漊I鏇存柊
      setTimeout(() => {
        map.render();
      }, 100);
    }
    
    // 纭繚璁剧疆绔嬪嵆鐢熸晥
    layerRef.value.updateTrackPlayer(trackId, {
      showNodes: trackPlayShowNodes.value,
      showNodeAnchors: true,
      showNodeNames: true,  // 鏄剧ず鑺傜偣鍚嶇О
      showNodeTime: true,   // 鏄剧ず鑺傜偣鏃堕棿
      showPointNames: true, // 鏄剧ず绉诲姩鐐逛綅鍚嶇О
      showSpeed: true,      // 鏄剧ず閫熷害
      showNodeSpeed: true   // 鏄剧ず鑺傜偣閫熷害
    });
    
    // 鑾峰彇杞ㄨ抗鏁版嵁璁板綍鏃ュ織
    const track = tracks.value.find(t => t.id === trackId);
    if (track) {
      addLog('杞ㄨ抗', `姝ｅ湪鎾斁杞ㄨ抗: ${track.name}锛岄€熷害: ${trackPlaySpeed.value} km/h`);
    }
  } else {
    addLog('error', `鎾斁杞ㄨ抗澶辫触: ${trackId}`);
  }
};

// 鍋滄鎸囧畾ID鐨勮建杩?const stopTrackById = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '鍦板浘缁勪欢鏈垵濮嬪寲');
    return;
  }
  
  const success = layerRef.value.stopTrack(trackId);
  
  if (success) {
    addLog('杞ㄨ抗', `宸插仠姝㈡挱鏀捐建杩? ${trackId}`);
  } else {
    addLog('warn', `鍋滄杞ㄨ抗鎾斁澶辫触: ${trackId}`);
  }
};

// 鍒犻櫎鎸囧畾ID鐨勮建杩?const removeTrackById = (trackId: string) => {
  if (!layerRef.value) {
    addLog('error', '鍦板浘缁勪欢鏈垵濮嬪寲');
    return;
  }
  
  // 濡傛灉姝ｅ湪鎾斁锛屽厛鍋滄
  stopTrackById(trackId);
  
  // 绉婚櫎杞ㄨ抗
  const success = layerRef.value.removeTrack(trackId);
  
  if (success) {
    // 鏇存柊杞ㄨ抗鍒楄〃
    tracks.value = tracks.value.filter(t => t.id !== trackId);
    
    // 濡傛灉鍒犻櫎鐨勬槸褰撳墠閫変腑鐨勮建杩癸紝娓呴櫎閫変腑鐘舵€?    if (activeTrackId.value === trackId) {
      activeTrackId.value = null;
    }
    
    // 濡傛灉娌℃湁杞ㄨ抗浜嗭紝鏇存柊hasTrack鐘舵€?    if (tracks.value.length === 0) {
      hasTrack.value = false;
    }
    
    addLog('杞ㄨ抗', `宸插垹闄よ建杩? ${trackId}`);
  } else {
    addLog('error', `鍒犻櫎杞ㄨ抗澶辫触: ${trackId}`);
  }
};

// 鍒犻櫎鍑洪敊鐨刼nMounted鍧?</script>

<style scoped>
.sc-layer-example {
  padding: 20px;
}

.example-content {
  display: flex;
  margin-top: 20px;
}

.map-area {
  flex: 1;
  margin-right: 20px;
}

.config-area {
  width: 320px;
  overflow-y: auto;
  max-height: 700px;
}

.map-container {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.config-section {
  width: 100%;
}

.config-item {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.label {
  padding: 8px 12px;
  font-weight: 600;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.controls {
  padding: 12px;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.control-row span {
  margin-right: 8px;
  min-width: 80px;
}

.control-row .value {
  margin-left: 8px;
  min-width: auto;
  color: #1890ff;
}

.buttons-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

button {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  flex: 1;
}

button:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.primary-button {
  background-color: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.primary-button:hover {
  background-color: #40a9ff;
  color: #fff;
  border-color: #40a9ff;
}

.active-button {
  color: #1890ff;
  border-color: #1890ff;
}

.marker-stats, .shape-stats, .flight-line-stats, .marker-group-stats, .heatmap-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.marker-list, .shape-list, .flight-line-list, .marker-group-list, .heatmap-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.marker-item, .shape-item, .flight-line-item, .marker-group-item, .heatmap-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.marker-header, .shape-header, .flight-line-header, .marker-group-header, .heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.marker-id, .shape-id, .flight-line-id, .marker-group-name, .heatmap-name {
  font-weight: bold;
  font-size: 12px;
}

.heatmap-item {
  cursor: pointer;
}

.heatmap-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.heatmap-weight {
  font-size: 12px;
  color: #ff4d4f;
}

.heatmap-position {
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
}

.no-markers, .no-shapes, .no-flight-lines, .no-marker-groups, .no-heatmap-points {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

.more-markers, .more-shapes, .more-flight-lines, .more-heatmap-points {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
}

.flight-line-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flight-line-item:hover {
  background-color: #f0f0f0;
}

.line-content {
  flex: 1;
}

.line-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
}

.line-details {
  font-size: 12px;
  color: #666;
}

.active-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: #1890ff;
  color: #fff;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.flight-line-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.flight-line-route {
  display: flex;
  font-size: 12px;
  align-items: center;
}

.flight-line-arrow {
  margin: 0 4px;
  color: #1890ff;
}

.flight-line-value {
  font-size: 12px;
  color: #ff4d4f;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.log-item {
  font-size: 12px;
  margin-bottom: 4px;
  padding: 4px;
  border-bottom: 1px solid #f0f0f0;
}

.log-time {
  color: #8c8c8c;
  margin-right: 8px;
}

.log-type {
  color: #1890ff;
  font-weight: bold;
  margin-right: 8px;
}

.no-logs {
  color: #999;
  font-style: italic;
}

.feature-group-title {
  font-weight: bold;
  font-size: 13px;
  margin: 16px 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
  color: #1890ff;
}

.feature-group-title:first-child {
  margin-top: 0;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.button-group button {
  flex: 1;
  min-width: 80px;
}

/* 澧炲己鎸夐挳缁勬牱寮忥紝浣挎瘡琛屽彧鏈変袱涓寜閽?*/
.control-row .button-group {
  min-width: 0;
  width: 100%;
}

/* 宸ュ叿鏍忎綅缃寜閽壒娈婃牱寮?*/
.toolbar-position-row {
  margin-left: 88px; /* 涓庝笂鏂规爣绛惧榻?*/
}

/* 娣诲姞鍔熻兘鍒嗙粍鐨勫垎闅旂嚎 */
.feature-group-title + .control-row {
  margin-top: 8px;
}

/* 宸ュ叿鏍忎綅缃寜閽牱寮?*/
.toolbar-position-row {
  margin-left: 88px; /* 涓庝笂鏂规爣绛惧榻?*/
}

/* 宸ュ叿鏍忎綅缃寜閽縺娲荤姸鎬?*/
.toolbar-position-row .active-button {
  background-color: #e6f7ff;
  color: #1890ff;
  border-color: #1890ff;
  font-weight: bold;
}

/* 娣诲姞鍔熻兘鍒嗙粍鐨勫垎闅旂嚎 */
.feature-group-title + .control-row {
  margin-top: 8px;
}

.shape-status span.visible {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.shape-status span.hidden {
  background-color: #fff1f0;
  color: #f5222d;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.shape-data-item {
  font-size: 12px;
  margin-bottom: 2px;
  color: #666;
}

/* 鐑姏鍥炬牱寮?*/
.heatmap-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.heatmap-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.heatmap-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.heatmap-name {
  font-weight: bold;
  font-size: 12px;
}

.heatmap-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.heatmap-weight {
  font-size: 12px;
  color: #ff4d4f;
}

.heatmap-position {
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
}

.no-heatmap-points {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

.more-heatmap-points {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 4px 0;
  font-size: 12px;
}

.flight-lines-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.flight-line-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.flight-line-item.active {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.flight-line-title {
  font-weight: bold;
  font-size: 12px;
}

.flight-line-details {
  font-size: 12px;
  color: #666;
}

.active-badge {
  background-color: #1890ff;
  color: #fff;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.empty-tip {
  color: #999;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
}

/* 杞ㄨ抗鍒楄〃鏍峰紡 */
.track-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fff;
  padding: 8px;
}

.track-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.track-item:hover {
  background-color: #e6f7ff;
}

.track-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.track-name {
  font-weight: bold;
  font-size: 12px;
}

.track-points-count {
  font-size: 12px;
  color: #666;
}

.track-item-actions {
  display: flex;
  gap: 8px;
}

.track-item.active {
  border-color: #1890ff;
  background-color: #e6f7ff;
}
</style> 


