library(shiny)
library(dplyr)
library(shinyAce)
library(DT)
library(shinyProc)

tmpVals = structure(list(col = c("Species", "Species"), levels = c("\"setosa\", \"versicolor\", \"virginica\"", 
                                                         "\"versicolor\", \"virginica\"")), .Names = c("col", "levels"
                                                         ), row.names = 1:2, class = c("tbl_df", "tbl", "data.frame"))
yamlTmp = as.yaml(list(Filters = tmpVals))

flog.threshold(TRACE)

# Define UI for application that draws a histogram
ui <- shinyUI(fluidPage(
   
   # Application title
   titlePanel("Filters app"),
   
   # Sidebar with a slider input for number of bins 
   sidebarLayout(
      sidebarPanel(
        
        actionButton("loadFilters", "Load filters"),
        actionButton("loadFiltersFromAce", "Load filters from TextEditor"),
        filtersUI("filters")
      ),
      
      # Show a plot of the generated distribution
      mainPanel(
          dataTableOutput("dataFiltered"),
          aceEditor(outputId = "editor", mode = "r", value = yamlTmp)
      )
   )
))

# Define server logic required to draw a histogram
server <- shinyServer(function(input, output) {
  
  flt = reactiveValues(flt = NULL)
  
  observeEvent(input$loadFilters,
   {
     flog.trace("Update Load Button")
     flt$flt = structure(list(col = c("Species", "Species"), levels = c("\"setosa\", \"versicolor\", \"virginica\"", 
                                                              "\"versicolor\", \"virginica\"")), .Names = c("col", "levels"
                                                              ), row.names = 1:2, class = c("tbl_df", "tbl", "data.frame"))
   })
  
  observeEvent(input$loadFiltersFromAce,
               {
                 flog.trace("Update ACE")
                 tmp = yaml.load(input$editor)$Filters
                 flt$flt = as_data_frame(tmp)
               })
  
  
  
  
  loadedFilters = reactive(
  {
    input$loadFiltersFromAce
    input$loadFilters
    flog.trace("Update loadedFilters")
    flt$flt
  })
  
  filters = callModule(makeFilters,"filters", 
                       data = iris, 
                       columnsToFilter = "Species",
                       sliders = list("Sepal.Width" = list(label = "Sepal.Width", 
                                                           step = 0.1),
                                      "Sepal.Length" = list(label = "Sepal.Length",
                                                           step = 0.1)),
                       defaultFilters = loadedFilters)
  
  observe({ print(filters$filters) })
  
  output$dataFiltered = renderDataTable({
    filters$call()
  })
  
})

# Run the application 
shinyApp(ui = ui, server = server)


