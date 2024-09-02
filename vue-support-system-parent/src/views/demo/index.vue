<script>
import * as Draggabilly from "draggabilly";
import Close from "@iconify-icons/ep/close";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

export default {
  data() {
    return {
      icon: { close: null },
      draggie: null,
      elem: ".container"
    };
  },
  mounted() {
    this.icon.close = useRenderIcon(Close);

    this.draggie = Draggabilly.default(this.elem, {
      handle: ".handle"
    });
  },
  methods: {}
};
</script>
<template>
  <div ref="container">
    <div class="el-dialog handle" tabindex="-1" style="--el-dialog-width: 800px">
      <header class="el-dialog__header show-close">
        <span role="heading" aria-level="2" class="el-dialog__title">Shipping address</span>
        <button aria-label="Close this dialog" class="el-dialog__headerbtn" type="button">
          <el-icon>
            <component :is="icon.close" />
          </el-icon>
        </button>
      </header>
      <div id="el-id-1024-54" class="el-dialog__body">
        <div class="el-table--fit el-table--enable-row-hover el-table--enable-row-transition el-table el-table--layout-fixed is-scrolling-none" data-prefix="el">
          <div class="el-table__inner-wrapper">
            <div class="hidden-columns">
              <div />
              <div />
              <div />
            </div>
            <div class="el-table__header-wrapper">
              <table class="el-table__header" border="0" cellpadding="0" cellspacing="0" style="width: 768px">
                <colgroup>
                  <col name="el-table_1_column_1" width="150" />
                  <col name="el-table_1_column_2" width="200" />
                  <col name="el-table_1_column_3" width="418" />
                </colgroup>
                <thead class="">
                  <tr class="">
                    <th class="el-table_1_column_1 is-leaf el-table__cell" colspan="1" rowspan="1">
                      <div class="cell">
                        Date
                        <!---->
                        <!---->
                      </div>
                    </th>
                    <th class="el-table_1_column_2 is-leaf el-table__cell" colspan="1" rowspan="1">
                      <div class="cell">
                        Name
                        <!---->
                        <!---->
                      </div>
                    </th>
                    <th class="el-table_1_column_3 is-leaf el-table__cell" colspan="1" rowspan="1">
                      <div class="cell">
                        Address
                        <!---->
                        <!---->
                      </div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
            <div class="el-table__body-wrapper">
              <div class="el-scrollbar">
                <div class="el-scrollbar__wrap el-scrollbar__wrap--hidden-default">
                  <div class="el-scrollbar__view" style="display: inline-block; vertical-align: middle">
                    <table class="el-table__body" cellspacing="0" cellpadding="0" border="0" style="table-layout: fixed; width: 768px">
                      <colgroup>
                        <col name="el-table_1_column_1" width="150" />
                        <col name="el-table_1_column_2" width="200" />
                        <col name="el-table_1_column_3" width="418" />
                      </colgroup>
                      <!--v-if-->
                      <tbody tabindex="-1">
                        <tr class="el-table__row">
                          <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              2016-05-02
                            </div>
                          </td>
                          <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              John Smith
                            </div>
                          </td>
                          <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              No.1518, Jinshajiang Road, Putuo District
                            </div>
                          </td>
                        </tr>
                        <tr class="el-table__row">
                          <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              2016-05-04
                            </div>
                          </td>
                          <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              John Smith
                            </div>
                          </td>
                          <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              No.1518, Jinshajiang Road, Putuo District
                            </div>
                          </td>
                        </tr>
                        <tr class="el-table__row">
                          <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              2016-05-01
                            </div>
                          </td>
                          <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              John Smith
                            </div>
                          </td>
                          <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              No.1518, Jinshajiang Road, Putuo District
                            </div>
                          </td>
                        </tr>
                        <tr class="el-table__row">
                          <td class="el-table_1_column_1 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              2016-05-03
                            </div>
                          </td>
                          <td class="el-table_1_column_2 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              John Smith
                            </div>
                          </td>
                          <td class="el-table_1_column_3 el-table__cell" rowspan="1" colspan="1">
                            <div class="cell">
                              <!---->
                              No.1518, Jinshajiang Road, Putuo District
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      <!--v-if-->
                    </table>
                    <!--v-if-->
                    <!--v-if-->
                  </div>
                </div>
                <div class="el-scrollbar__bar is-horizontal" style="display: none"><div class="el-scrollbar__thumb" style="transform: translateX(0%)" /></div>
                <div class="el-scrollbar__bar is-vertical" style="display: none"><div class="el-scrollbar__thumb" style="transform: translateY(0%)" /></div>
              </div>
            </div>
            <!--v-if-->
            <!--v-if-->
          </div>
          <div class="el-table__column-resize-proxy" style="display: none" />
        </div>
      </div>
      <!--v-if-->
    </div>
  </div>
</template>
