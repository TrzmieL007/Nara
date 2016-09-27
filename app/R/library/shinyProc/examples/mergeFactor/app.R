library(shiny)
library(futile.logger)
x = tmp()

flog.threshold(DEBUG)

ui <- fluidPage(
   
   titlePanel("Merger app"),
   
   sidebarLayout(
      sidebarPanel(
        
        mergeFactorUI("merger")
        
      ),
      
      mainPanel(
      )
   )
)

server <- function(input, output) {
  
  callModule(makeMergeFactor, "merger", x, list())
  
}

# Run the application 
shinyApp(ui = ui, server = server)

